// apps/web/app/quote/QuotePage.tsx
'use client';

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import clsx from 'clsx';
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
import { analyzeManufacturability } from '@/lib/manufacturability';
import { validateAddress, type ShippingAddress, type AddressField } from '@/lib/address';
import { initialState, reducer } from './state';
import { Reveal } from '@/components/ui/Reveal';
import { AgentInput } from '@/components/ui/AgentInput';
import styles from './QuotePage.module.css';

const EMPTY_ADDRESS: ShippingAddress = {
  name: '', phone: '', email: '', line1: '', line2: '', city: '', state: '', pincode: '',
};

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

const DROPZONE_HINTS = [
  'Drop an STL to see the real price…',
  'Upload OBJ or 3MF too…',
  'Nothing leaves your device until checkout…',
] as const;

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
  const [addr, setAddr] = useState<ShippingAddress>(EMPTY_ADDRESS);
  const [addrErrors, setAddrErrors] = useState<Partial<Record<AddressField, string>>>({});
  const setField = (k: AddressField) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setAddr((a) => ({ ...a, [k]: e.target.value }));
  const field = (k: AddressField, label: string, placeholder?: string, inputMode?: 'numeric' | 'tel' | 'email') => (
    <label className={styles.row}>
      <span className={styles.rowLabel}>{label}</span>
      <input type="text" value={addr[k] ?? ''} onChange={setField(k)} placeholder={placeholder} inputMode={inputMode} />
      {addrErrors[k] && <span className={clsx(styles.warning, styles.fieldError)}>{addrErrors[k]}</span>}
    </label>
  );
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
    const av = validateAddress(addr);
    setAddrErrors(av.fieldErrors);
    if (!av.ok) {
      setCheckout({ phase: 'error', message: 'Please complete the shipping address below.' });
      return;
    }
    setCheckout({ phase: 'creating' });
    try {
      // The SERVER reprices from its own volume measurement of every file; we send no amount.
      const order = await createOrder(orderFiles, { rush: state.rush, promo: state.appliedPromo, address: addr });
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
  }, [state.files, state.rush, state.appliedPromo, addr]);

  const onDownloadPdf = useCallback(async () => {
    const files = state.files
      .map((r) =>
        r.parse.status === 'done'
          ? {
              filename: r.fileName,
              volumeMm3: r.parse.result.volumeMm3,
              bboxSize: r.parse.result.bboxSize,
              triangleCount: r.parse.result.triangleCount,
              config: r.config,
            }
          : null,
      )
      .filter(Boolean);
    if (!files.length) return;
    const res = await fetch('/api/quote/pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ files, rush: state.rush, promo: state.appliedPromo }),
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'printgrid-quote.pdf';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
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
      <section className={styles.head}>
        <div className="wrap">
          <Reveal>
            <div className={styles.eyebrow}>Quote · live calculator</div>
            <h1 className={styles.title}>Drop a file. See a price.</h1>
            <p className={styles.lede}>
              STLs are parsed in your browser. Nothing leaves your device until you check out. The
              number on the right is the number you pay — including 18% GST and the 2% payment fee.
            </p>
          </Reveal>
        </div>
      </section>

      <section className={styles.section}>
        <div className="wrap">
          {checkout.phase !== 'idle' && (
            <div
              role="status"
              aria-live="polite"
              className={clsx(
                styles.banner,
                checkout.phase === 'paid' && styles.bannerPaid,
                checkout.phase === 'error' && styles.bannerError,
              )}
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

          <div className={styles.grid}>
            {/* Left: upload + per-file controls */}
            <Reveal className={styles.col}>
              {activeRow && activeRow.parse.status === 'done' && activeFile && (
                <StlViewer
                  file={activeFile}
                  materialKey={activeRow.config.materialKey}
                  triangleCount={activeRow.parse.result.triangleCount}
                />
              )}
              <AgentInput placeholders={DROPZONE_HINTS}>
                <label
                  className={clsx(styles.dropzone, dropActive && styles.dropzoneOver)}
                  onDrop={(e) => { e.preventDefault(); setDropActive(false); acceptFiles(Array.from(e.dataTransfer.files)); }}
                  onDragOver={(e) => { e.preventDefault(); setDropActive(true); }}
                  onDragLeave={(e) => { e.preventDefault(); setDropActive(false); }}
                >
                  <p className={styles.dropzoneTitle}>Drop STL, OBJ or 3MF files here</p>
                  <p className={styles.dropzoneSub}>Or click to browse</p>
                  <p className={clsx(styles.dropzoneHint, styles.mono)}>Max 100 MB each · up to 10 files</p>
                  <input
                    type="file"
                    accept=".stl,.obj,.3mf,model/stl,application/octet-stream"
                    multiple
                    className={styles.srOnly}
                    aria-label="Upload STL, OBJ or 3MF files"
                    onChange={(e) => { acceptFiles(e.target.files ? Array.from(e.target.files) : []); e.target.value = ''; }}
                  />
                </label>
              </AgentInput>

              {dropErrors.length > 0 && (
                <div role="alert" className={styles.dropErrors}>
                  {dropErrors.map((e, i) => (
                    <p className={styles.warning} key={i}>{e}</p>
                  ))}
                </div>
              )}

              {state.files.length > 0 && (
                <div className={styles.files}>
                  {state.files.map((row) => {
                    const done = row.parse.status === 'done' ? row.parse.result : null;
                    const warnings = done
                      ? analyzeManufacturability({ volumeMm3: done.volumeMm3, bboxSize: done.bboxSize, triangleCount: done.triangleCount })
                      : [];
                    return (
                      <div className={styles.fileCard} key={row.id}>
                        <div className={styles.fileCardHeader}>
                          <span className={styles.fileCardName}>{row.fileName}</span>
                          <button className={styles.fileRemove} type="button" aria-label="Remove file" onClick={() => onRemove(row.id)}>×</button>
                        </div>
                        <div className={clsx(styles.fileCardStats, styles.mono)}>
                          {row.parse.status === 'parsing' && 'Parsing…'}
                          {row.parse.status === 'error' && row.parse.message}
                          {done && `${done.triangleCount.toLocaleString()} tris · ${(done.volumeMm3 / 1000).toFixed(1)} cm³ · ${done.bboxSize.map((d) => d.toFixed(0)).join('×')} mm`}
                        </div>
                        {warnings.map((w) => (
                          <p className={clsx(styles.warning, w.severity === 'error' && styles.warningError, w.severity === 'info' && styles.warningInfo)} key={w.code}>{w.message}</p>
                        ))}

                        <div className={styles.controls}>
                          <label className={styles.row}>
                            <span className={styles.rowLabel}>Material</span>
                            <select
                              value={row.config.materialKey}
                              onChange={(e) => dispatch({ type: 'UPDATE_CONFIG', id: row.id, patch: { materialKey: e.target.value as MaterialKey } })}
                            >
                              {MATERIAL_KEYS.map((k) => (
                                <option key={k} value={k}>{MATERIALS[k].name} · {formatINR(MATERIALS[k].ratePerGramPaise)}/g</option>
                              ))}
                            </select>
                          </label>
                          <label className={styles.row}>
                            <span className={styles.rowLabel}>Layer height</span>
                            <select
                              value={row.config.layerHeight}
                              onChange={(e) => dispatch({ type: 'UPDATE_CONFIG', id: row.id, patch: { layerHeight: e.target.value as LayerHeight } })}
                            >
                              {LAYER_HEIGHTS.map((h) => <option key={h} value={h}>{h} mm</option>)}
                            </select>
                          </label>
                          <label className={styles.row}>
                            <span className={styles.rowLabel}>Finish</span>
                            <select
                              value={row.config.finish}
                              onChange={(e) => dispatch({ type: 'UPDATE_CONFIG', id: row.id, patch: { finish: e.target.value as Finish } })}
                            >
                              {FINISH_KEYS.map((f) => (
                                <option key={f} value={f}>{FINISH_LABELS[f]}{FINISHES[f] ? ` · +${formatINR(FINISHES[f])}` : ''}</option>
                              ))}
                            </select>
                          </label>
                          <label className={styles.row}>
                            <span className={styles.rowLabel}>Quantity</span>
                            <input
                              type="number"
                              min={1}
                              value={row.config.qty}
                              onChange={(e) => dispatch({ type: 'UPDATE_CONFIG', id: row.id, patch: { qty: Math.max(1, parseInt(e.target.value, 10) || 1) } })}
                            />
                          </label>
                        </div>
                        <label className={clsx(styles.row, styles.rowCheck)}>
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

              {state.files.length > 0 && (
                <div className={clsx(styles.fileCard, styles.addressCard)}>
                  <div className={styles.fileCardHeader}>
                    <span className={styles.fileCardName}>Shipping address</span>
                  </div>
                  <div className={styles.controls}>
                    {field('name', 'Full name')}
                    {field('phone', 'Phone', '10-digit mobile', 'tel')}
                  </div>
                  {field('email', 'Email (for confirmation)', 'you@example.com', 'email')}
                  {field('line1', 'Address line 1')}
                  {field('line2', 'Address line 2 (optional)')}
                  <div className={styles.controls}>
                    {field('city', 'City')}
                    {field('state', 'State')}
                  </div>
                  {field('pincode', 'PIN code', '6 digits', 'numeric')}
                </div>
              )}
            </Reveal>

            {/* Right: price card */}
            <Reveal className={styles.col} delay={0.1}>
              <div className={styles.card}>
                <div className="quote-print-only">
                  <strong>PrintGrid Studio — Quote</strong>
                  <div className={clsx(styles.mono, styles.cardCaption)}>FDM 3D printing · Chennai · printgrid.co.in</div>
                </div>
                <div className={styles.totalHeadline}>{result ? formatINR(result.grandTotalPaise) : '—'}</div>
                <div className={styles.totalCaption}>Total · incl. GST</div>

                {!result && <p className={styles.cardEmpty}>Upload an STL to see your price.</p>}

                {result && (
                  <>
                    <div className={styles.cardLine}>
                      <div className={styles.rowLine}><span>Subtotal ({fileCount} file{fileCount === 1 ? '' : 's'})</span><span className={styles.mono}>{formatINR(result.subtotalPaise)}</span></div>
                      {result.rushFeePaise > 0 && <div className={styles.rowLine}><span>Rush (+25%)</span><span className={styles.mono}>{formatINR(result.rushFeePaise)}</span></div>}
                      {result.promoDiscountPaise > 0 && <div className={clsx(styles.rowLine, styles.rowLineDiscount)}><span>Promo {result.appliedPromo}</span><span className={styles.mono}>−{formatINR(result.promoDiscountPaise)}</span></div>}
                      <div className={styles.rowLine}><span>Shipping</span><span className={styles.mono}>{result.shippingPaise === 0 ? 'Free' : formatINR(result.shippingPaise)}</span></div>
                      <div className={styles.rowLine}><span>GST (18%)</span><span className={styles.mono}>{formatINR(result.gstTotalPaise)}</span></div>
                      <div className={styles.rowLine}><span>Payment fee (2%)</span><span className={styles.mono}>{formatINR(result.paymentFeePaise)}</span></div>
                    </div>
                    <div className={styles.cardLine}>
                      <div className={clsx(styles.rowLine, styles.rowLineStrong)}><span>Total</span><span className={styles.mono}>{formatINR(result.grandTotalPaise)}</span></div>
                    </div>
                  </>
                )}

                <label className={clsx(styles.row, styles.rowCheck, styles.rushRow)}>
                  <input type="checkbox" checked={state.rush} onChange={() => dispatch({ type: 'TOGGLE_RUSH' })} />
                  <span>Rush — print first (+25%)</span>
                </label>

                <div className={styles.row}>
                  <span className={styles.rowLabel}>Promo code</span>
                  <div className={styles.promoRow}>
                    <input
                      type="text"
                      value={state.promoInput}
                      placeholder="FIRSTPRINT"
                      onChange={(e) => dispatch({ type: 'SET_PROMO_INPUT', value: e.target.value })}
                      className={styles.promoInput}
                    />
                    {state.appliedPromo ? (
                      <button type="button" className={styles.ctaSecondary} onClick={() => dispatch({ type: 'CLEAR_PROMO' })}>Clear</button>
                    ) : (
                      <button type="button" className={styles.ctaSecondary} onClick={() => dispatch({ type: 'APPLY_PROMO' })}>Apply</button>
                    )}
                  </div>
                  {state.promoError && <p className={clsx(styles.warning, styles.promoNote)}>{state.promoError}</p>}
                  {state.appliedPromo && <p className={clsx(styles.cardCaption, styles.mono, styles.promoNote)}>{state.appliedPromo} applied</p>}
                </div>

                <button type="button" className={styles.cta} onClick={onContinue} disabled={!canContinue || busy}>
                  {busy ? 'Working…' : 'Continue to payment'}
                </button>
                {blockedReason && <p className={styles.cardCaption}>{blockedReason}</p>}
                {result && (
                  <button type="button" className={clsx(styles.ctaSecondary, 'quote-print-hide')} onClick={onDownloadPdf}>
                    Download PDF report
                  </button>
                )}
                {result && (
                  <button type="button" className={clsx(styles.ctaSecondary, 'quote-print-hide')} onClick={() => window.print()}>
                    Print quote
                  </button>
                )}
                <p className={styles.cardCaption}>
                  The charged amount is recomputed on our server from the file&rsquo;s true volume.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
