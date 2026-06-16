'use client';

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useStlParser } from '@/lib/use-stl-parser';
import {
  quote,
  computeMass,
  formatINR,
  MATERIALS,
  FINISHES,
  type FileInput,
  type QuoteResult,
  type MaterialKey,
  type LayerHeight,
  type Finish,
} from '@printgrid/pricing';
import { createOrder, loadRazorpay, openCheckout, pollUntilPaid } from '@/lib/checkout';
import { parseModel } from '@/lib/parse-model';
import { initialState, reducer } from './state';

type CheckoutState =
  | { phase: 'idle' }
  | { phase: 'creating' }
  | { phase: 'awaiting' }
  | { phase: 'confirming'; code: string }
  | { phase: 'paid'; code: string }
  | { phase: 'error'; message: string };

const MATERIAL_KEYS: MaterialKey[] = ['pla-plus', 'pla-lw', 'petg', 'abs', 'tpu-95a', 'pa6', 'pa-cf'];
const LAYER_HEIGHTS: LayerHeight[] = ['0.12', '0.16', '0.20', '0.24', '0.28'];
const FINISH_KEYS = Object.keys(FINISHES) as Finish[];
const FINISH_LABELS: Record<Finish, string> = {
  'as-printed': 'As printed',
  sanded: 'Sanded',
  primer: 'Primer',
  gloss: 'Gloss',
};

const MAX_FILES = 10;
const MAX_BYTES = 100 * 1024 * 1024;

// three.js viewer is browser-only — load it client-side, never on the server.
const StlViewer = dynamic(() => import('./StlViewer').then((m) => m.StlViewer), {
  ssr: false,
  loading: () => (
    <div className="quote-viewer">
      <div className="quote-viewer__empty">Loading preview…</div>
    </div>
  ),
});

let idCounter = 0;
const nextId = () => `f${++idCounter}-${Date.now().toString(36)}`;

export function QuotePage() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { parse } = useStlParser();
  const filesRef = useRef<Map<string, File>>(new Map());
  const parsingRef = useRef<Set<string>>(new Set());
  const [dropActive, setDropActive] = useState(false);
  const [dropErrors, setDropErrors] = useState<string[]>([]);

  const acceptFiles = useCallback((files: File[]) => {
    const errs: string[] = [];
    const ok: File[] = [];
    const remaining = MAX_FILES - filesRef.current.size;
    const seen = new Set(Array.from(filesRef.current.values()).map((x) => `${x.name}:${x.size}`));
    for (const f of files) {
      const sig = `${f.name}:${f.size}`;
      if (ok.length >= remaining) { errs.push(`Only ${MAX_FILES} files per quote — ${f.name} dropped`); continue; }
      if (!/\.(stl|obj|3mf)$/i.test(f.name)) { errs.push(`${f.name}: must be STL, OBJ or 3MF`); continue; }
      if (f.size > MAX_BYTES) { errs.push(`${f.name}: exceeds 100MB`); continue; }
      if (f.size === 0) { errs.push(`${f.name}: file is empty`); continue; }
      if (seen.has(sig) || ok.some((o) => `${o.name}:${o.size}` === sig)) { errs.push(`${f.name}: already added — skipped duplicate`); continue; }
      ok.push(f);
    }
    setDropErrors(errs);
    if (ok.length) {
      const additions = ok.map((file) => {
        const id = nextId();
        filesRef.current.set(id, file);
        return { id, file };
      });
      dispatch({ type: 'ADD_FILES', payload: additions });
    }
  }, []);

  // Parse newly-added rows (the hook serialises internally).
  useEffect(() => {
    state.files.forEach((row) => {
      if (row.parse.status !== 'parsing' || parsingRef.current.has(row.id)) return;
      const file = filesRef.current.get(row.id);
      if (!file) return;
      parsingRef.current.add(row.id);
      const ext = file.name.toLowerCase().split('.').pop();
      // STL uses the fast off-thread worker; OBJ/3MF parse via three loaders.
      const parsing = ext === 'obj' || ext === '3mf' ? parseModel(file) : parse(file);
      parsing
        .then((result) => dispatch({ type: 'FILE_PARSED', id: row.id, result }))
        .catch((err: { message?: string }) =>
          dispatch({ type: 'FILE_PARSE_ERROR', id: row.id, message: String(err?.message ?? 'Parse failed') }),
        );
    });
  }, [state.files, parse]);

  const result: QuoteResult | null = useMemo(() => {
    const parsed = state.files.filter((f) => f.parse.status === 'done');
    if (parsed.length === 0) return null;
    const fileInputs: FileInput[] = parsed.map((row) => {
      if (row.parse.status !== 'done') throw new Error('unreachable');
      return {
        massGrams: computeMass(row.parse.result.volumeMm3, row.config.materialKey),
        materialKey: row.config.materialKey,
        layerHeight: row.config.layerHeight,
        finish: row.config.finish,
        multicolor: row.config.multicolor,
        qty: row.config.qty,
      };
    });
    try {
      return quote({ files: fileInputs, rush: state.rush, promo: state.appliedPromo });
    } catch {
      return null;
    }
  }, [state.files, state.rush, state.appliedPromo]);

  const { canContinue, blockedReason } = useMemo(() => {
    if (state.files.length === 0) return { canContinue: false, blockedReason: null };
    if (state.files.find((f) => f.parse.status === 'parsing'))
      return { canContinue: false, blockedReason: 'Wait for parsing to finish.' };
    if (state.files.find((f) => f.parse.status === 'error'))
      return { canContinue: false, blockedReason: 'One or more files failed to parse.' };
    const oversized = state.files.find(
      (f) => f.parse.status === 'done' && f.parse.result.bboxSize.some((d) => d > 256),
    );
    if (oversized) return { canContinue: false, blockedReason: 'A part exceeds the 256mm build envelope.' };
    return { canContinue: true, blockedReason: null };
  }, [state.files]);

  const [checkout, setCheckout] = useState<CheckoutState>({ phase: 'idle' });
  const busy = checkout.phase === 'creating' || checkout.phase === 'awaiting' || checkout.phase === 'confirming';

  const onContinue = useCallback(async () => {
    const doneFiles = state.files.filter((f) => f.parse.status === 'done');
    if (doneFiles.length === 0) {
      setCheckout({ phase: 'error', message: 'Add at least one file before checking out.' });
      return;
    }
    const orderFiles = doneFiles
      .map((row) => ({ file: filesRef.current.get(row.id), config: row.config }))
      .filter((x): x is { file: File; config: typeof x.config } => !!x.file);
    if (orderFiles.length !== doneFiles.length) {
      setCheckout({ phase: 'error', message: 'Could not read one of the files. Please re-add it.' });
      return;
    }
    setCheckout({ phase: 'creating' });
    try {
      // The SERVER reprices from its own volume measurement of every file; we send no amount.
      const order = await createOrder(orderFiles, { rush: state.rush, promo: state.appliedPromo });
      await loadRazorpay();
      setCheckout({ phase: 'awaiting' });
      openCheckout({
        order,
        onSuccess: async () => {
          // The browser cannot self-confirm — poll until the verified webhook flips it.
          setCheckout({ phase: 'confirming', code: order.order_code });
          const outcome = await pollUntilPaid(order.order_code);
          setCheckout(outcome === 'paid' ? { phase: 'paid', code: order.order_code } : { phase: 'confirming', code: order.order_code });
        },
        onDismiss: () => setCheckout({ phase: 'idle' }),
      });
    } catch (err) {
      setCheckout({ phase: 'error', message: (err as Error).message });
    }
  }, [state.files, state.rush, state.appliedPromo]);

  const onRemove = useCallback((id: string) => {
    filesRef.current.delete(id);
    parsingRef.current.delete(id);
    dispatch({ type: 'REMOVE_FILE', id });
  }, []);

  const fileCount = state.files.filter((f) => f.parse.status === 'done').length;
  const activeRow = state.files.find((f) => f.parse.status === 'done');
  const activeFile = activeRow ? filesRef.current.get(activeRow.id) : undefined;

  return (
    <>
      <section className="page-head">
        <div className="wrap">
          <div className="eyebrow page-head__eyebrow">Quote · live calculator</div>
          <h1 className="display-2">Drop a file. See a price.</h1>
          <p className="lede">
            STLs are parsed in your browser. Nothing leaves your device until you check out. The
            number on the right is the number you pay — including 18% GST and the 2% payment fee.
          </p>
        </div>
      </section>

      <section className="quote">
        <div className="wrap">
          {checkout.phase !== 'idle' && (
            <div
              role="status"
              aria-live="polite"
              className={
                'checkout-banner' +
                (checkout.phase === 'paid' ? ' checkout-banner--paid' : '') +
                (checkout.phase === 'error' ? ' checkout-banner--error' : '')
              }
            >
              {checkout.phase === 'creating' && 'Creating your order…'}
              {checkout.phase === 'awaiting' && 'Opening the secure Razorpay window…'}
              {checkout.phase === 'confirming' && (
                <>
                  <strong>Payment received — confirming with our server.</strong> Your order isn&rsquo;t
                  marked paid until we verify it. This updates automatically (order {checkout.code}).
                </>
              )}
              {checkout.phase === 'paid' && (
                <>
                  <strong>Paid ✓</strong> Order {checkout.code} is confirmed — a confirmation email is
                  on its way.
                </>
              )}
              {checkout.phase === 'error' && <>Checkout error: {checkout.message}</>}
            </div>
          )}

          <div className="quote-grid">
            {/* Left: upload + per-file controls */}
            <div className="quote-col quote-col--left">
              {activeRow && activeRow.parse.status === 'done' && activeFile && (
                <StlViewer
                  file={activeFile}
                  materialKey={activeRow.config.materialKey}
                  triangleCount={activeRow.parse.result.triangleCount}
                />
              )}
              <label
                className={'quote-dropzone' + (dropActive ? ' is-over' : '')}
                onDrop={(e) => { e.preventDefault(); setDropActive(false); acceptFiles(Array.from(e.dataTransfer.files)); }}
                onDragOver={(e) => { e.preventDefault(); setDropActive(true); }}
                onDragLeave={(e) => { e.preventDefault(); setDropActive(false); }}
              >
                <p className="quote-dropzone__title">Drop STL, OBJ or 3MF files here</p>
                <p className="quote-dropzone__sub">Or click to browse</p>
                <p className="quote-dropzone__hint mono">Max 100 MB each · up to 10 files</p>
                <input
                  type="file"
                  accept=".stl,.obj,.3mf,model/stl,application/octet-stream"
                  multiple
                  className="hidden"
                  aria-label="Upload STL files"
                  onChange={(e) => { acceptFiles(e.target.files ? Array.from(e.target.files) : []); e.target.value = ''; }}
                />
              </label>

              {dropErrors.length > 0 && (
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {dropErrors.map((e, i) => (
                    <p className="quote-warning" key={i}>{e}</p>
                  ))}
                </div>
              )}

              {state.files.length > 0 && (
                <div className="quote-files">
                  {state.files.map((row) => {
                    const done = row.parse.status === 'done' ? row.parse.result : null;
                    const warnings: string[] = [];
                    if (done) {
                      if (done.bboxSize.some((d) => d > 256)) warnings.push('Exceeds the 256 mm build envelope — please scale down.');
                      if (Math.max(...done.bboxSize) < 10) warnings.push('Very small — if this was exported in inches, scale it ×25.4.');
                      if (done.triangleCount > 250_000) warnings.push('Very high triangle count — the preview is simplified.');
                      const bboxVol = done.bboxSize[0] * done.bboxSize[1] * done.bboxSize[2];
                      if (bboxVol > 0 && done.volumeMm3 / bboxVol < 0.002) warnings.push('Mesh may not be watertight — the measured volume looks low. We will flag this before printing.');
                    }
                    return (
                      <div className="quote-file-card" key={row.id}>
                        <div className="quote-file-card__header">
                          <span className="quote-file-card__name">{row.fileName}</span>
                          <button className="quote-file__remove" type="button" aria-label="Remove file" onClick={() => onRemove(row.id)}>×</button>
                        </div>
                        <div className="quote-file-card__stats mono">
                          {row.parse.status === 'parsing' && 'Parsing…'}
                          {row.parse.status === 'error' && row.parse.message}
                          {done && `${done.triangleCount.toLocaleString()} tris · ${(done.volumeMm3 / 1000).toFixed(1)} cm³ · ${done.bboxSize.map((d) => d.toFixed(0)).join('×')} mm`}
                        </div>
                        {warnings.map((w, i) => <p className="quote-warning" key={i}>{w}</p>)}

                        <div className="quote-controls">
                          <label className="quote-row">
                            <span className="quote-row__label">Material</span>
                            <select
                              value={row.config.materialKey}
                              onChange={(e) => dispatch({ type: 'UPDATE_CONFIG', id: row.id, patch: { materialKey: e.target.value as MaterialKey } })}
                            >
                              {MATERIAL_KEYS.map((k) => (
                                <option key={k} value={k}>{MATERIALS[k].name} · {formatINR(MATERIALS[k].ratePerGramPaise)}/g</option>
                              ))}
                            </select>
                          </label>
                          <label className="quote-row">
                            <span className="quote-row__label">Layer height</span>
                            <select
                              value={row.config.layerHeight}
                              onChange={(e) => dispatch({ type: 'UPDATE_CONFIG', id: row.id, patch: { layerHeight: e.target.value as LayerHeight } })}
                            >
                              {LAYER_HEIGHTS.map((h) => <option key={h} value={h}>{h} mm</option>)}
                            </select>
                          </label>
                          <label className="quote-row">
                            <span className="quote-row__label">Finish</span>
                            <select
                              value={row.config.finish}
                              onChange={(e) => dispatch({ type: 'UPDATE_CONFIG', id: row.id, patch: { finish: e.target.value as Finish } })}
                            >
                              {FINISH_KEYS.map((f) => (
                                <option key={f} value={f}>{FINISH_LABELS[f]}{FINISHES[f] ? ` · +${formatINR(FINISHES[f])}` : ''}</option>
                              ))}
                            </select>
                          </label>
                          <label className="quote-row">
                            <span className="quote-row__label">Quantity</span>
                            <input
                              type="number"
                              min={1}
                              value={row.config.qty}
                              onChange={(e) => dispatch({ type: 'UPDATE_CONFIG', id: row.id, patch: { qty: Math.max(1, parseInt(e.target.value, 10) || 1) } })}
                            />
                          </label>
                        </div>
                        <label className="quote-row quote-row--check">
                          <input
                            type="checkbox"
                            checked={row.config.multicolor}
                            onChange={(e) => dispatch({ type: 'UPDATE_CONFIG', id: row.id, patch: { multicolor: e.target.checked } })}
                          />
                          <span>Multi-colour (+20%)</span>
                        </label>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right: price card */}
            <div className="quote-col quote-col--right">
              <div className="quote-card">
                <div className="quote-print-only">
                  <strong>PrintGrid Studio — Quote</strong>
                  <div className="mono" style={{ fontSize: 12, color: 'var(--ink-60)' }}>FDM 3D printing · Chennai · printgrid.co.in</div>
                </div>
                <div className="quote-card__total-headline">{result ? formatINR(result.grandTotalPaise) : '—'}</div>
                <div className="quote-card__total-caption">Total · incl. GST</div>

                {!result && <p className="quote-card__empty">Upload an STL to see your price.</p>}

                {result && (
                  <>
                    <div className="quote-card__line">
                      <div className="quote-row-line"><span>Subtotal ({fileCount} file{fileCount === 1 ? '' : 's'})</span><span className="mono">{formatINR(result.subtotalPaise)}</span></div>
                      {result.rushFeePaise > 0 && <div className="quote-row-line"><span>Rush (+25%)</span><span className="mono">{formatINR(result.rushFeePaise)}</span></div>}
                      {result.promoDiscountPaise > 0 && <div className="quote-row-line quote-row-line--discount"><span>Promo {result.appliedPromo}</span><span className="mono">−{formatINR(result.promoDiscountPaise)}</span></div>}
                      <div className="quote-row-line"><span>Shipping</span><span className="mono">{result.shippingPaise === 0 ? 'Free' : formatINR(result.shippingPaise)}</span></div>
                      <div className="quote-row-line"><span>GST (18%)</span><span className="mono">{formatINR(result.gstTotalPaise)}</span></div>
                      <div className="quote-row-line"><span>Payment fee (2%)</span><span className="mono">{formatINR(result.paymentFeePaise)}</span></div>
                    </div>
                    <div className="quote-card__line">
                      <div className="quote-row-line quote-row-line--strong"><span>Total</span><span className="mono">{formatINR(result.grandTotalPaise)}</span></div>
                    </div>
                  </>
                )}

                <label className="quote-row quote-row--check" style={{ marginTop: 8 }}>
                  <input type="checkbox" checked={state.rush} onChange={() => dispatch({ type: 'TOGGLE_RUSH' })} />
                  <span>Rush — print first (+25%)</span>
                </label>

                <div className="quote-row">
                  <span className="quote-row__label">Promo code</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="text"
                      value={state.promoInput}
                      placeholder="FIRSTPRINT"
                      onChange={(e) => dispatch({ type: 'SET_PROMO_INPUT', value: e.target.value })}
                      style={{ textTransform: 'uppercase' }}
                    />
                    {state.appliedPromo ? (
                      <button type="button" className="btn btn-ghost" onClick={() => dispatch({ type: 'CLEAR_PROMO' })}>Clear</button>
                    ) : (
                      <button type="button" className="btn btn-ghost" onClick={() => dispatch({ type: 'APPLY_PROMO' })}>Apply</button>
                    )}
                  </div>
                  {state.promoError && <p className="quote-warning" style={{ marginTop: 6 }}>{state.promoError}</p>}
                  {state.appliedPromo && <p className="quote-card__caption mono" style={{ marginTop: 6 }}>{state.appliedPromo} applied</p>}
                </div>

                <button type="button" className="btn btn-primary quote-cta" onClick={onContinue} disabled={!canContinue || busy}>
                  {busy ? 'Working…' : 'Continue to payment'}
                </button>
                {blockedReason && <p className="quote-card__caption">{blockedReason}</p>}
                {result && (
                  <button type="button" className="btn btn-ghost quote-print-hide" style={{ width: '100%' }} onClick={() => window.print()}>
                    Download / print quote
                  </button>
                )}
                <p className="quote-card__caption">
                  The charged amount is recomputed on our server from the file&rsquo;s true volume.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
