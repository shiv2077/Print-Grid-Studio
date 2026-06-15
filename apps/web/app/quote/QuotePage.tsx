'use client';

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { Container } from '@/components/ui/Container';
import { useStlParser } from '@/lib/use-stl-parser';
import { quote, formatINR, type FileInput, type QuoteResult } from '@printgrid/pricing';
import { computeMass } from '@printgrid/pricing';
import { createOrder, loadRazorpay, openCheckout, pollUntilPaid } from '@/lib/checkout';
import { Dropzone } from './Dropzone';
import { FileCard } from './FileCard';
import { PriceBreakdown } from './PriceBreakdown';
import { initialState, reducer } from './state';
import styles from './quote.module.css';

type CheckoutState =
  | { phase: 'idle' }
  | { phase: 'creating' }
  | { phase: 'awaiting' }
  | { phase: 'confirming'; code: string }
  | { phase: 'paid'; code: string }
  | { phase: 'error'; message: string };

let idCounter = 0;
const nextId = () => `f${++idCounter}-${Date.now().toString(36)}`;

export function QuotePage() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { parse } = useStlParser();
  // Raw File objects kept in a ref keyed by row id — we keep these out
  // of reducer state so the state stays serializable + cheap to compare.
  const filesRef = useRef<Map<string, File>>(new Map());
  // Track which IDs we've already kicked off a parse for, to avoid
  // parsing twice on a re-run of the effect.
  const parsingRef = useRef<Set<string>>(new Set());

  const onAcceptFiles = useCallback(
    (files: File[]) => {
      const additions = files.map((file) => {
        const id = nextId();
        filesRef.current.set(id, file);
        return { id, file };
      });
      dispatch({ type: 'ADD_FILES', payload: additions });
    },
    []
  );

  // Kick off parses for any rows that are still 'parsing' and haven't
  // been queued yet. The hook serialises calls internally, so order is
  // FIFO across multiple drops.
  useEffect(() => {
    state.files.forEach((row) => {
      if (row.parse.status !== 'parsing') return;
      if (parsingRef.current.has(row.id)) return;
      const file = filesRef.current.get(row.id);
      if (!file) return;
      parsingRef.current.add(row.id);
      parse(file)
        .then((result) => {
          dispatch({ type: 'FILE_PARSED', id: row.id, result });
        })
        .catch((err: { message?: string } | Error) => {
          const message =
            typeof err === 'object' && err && 'message' in err
              ? String((err as { message?: string }).message ?? 'Parse failed')
              : 'Parse failed';
          dispatch({ type: 'FILE_PARSE_ERROR', id: row.id, message });
        });
    });
  }, [state.files, parse]);

  // Build the pricing input from parsed files only.
  const result: QuoteResult | null = useMemo(() => {
    const parsed = state.files.filter(
      (f) => f.parse.status === 'done'
    );
    if (parsed.length === 0) return null;
    const fileInputs: FileInput[] = parsed.map((row) => {
      // status narrowed by filter
      if (row.parse.status !== 'done') {
        // unreachable but TS needs the guard
        throw new Error('unreachable');
      }
      const massGrams = computeMass(
        row.parse.result.volumeMm3,
        row.config.materialKey
      );
      return {
        massGrams,
        materialKey: row.config.materialKey,
        layerHeight: row.config.layerHeight,
        finish: row.config.finish,
        multicolor: row.config.multicolor,
        qty: row.config.qty,
      };
    });
    try {
      return quote({
        files: fileInputs,
        rush: state.rush,
        promo: state.appliedPromo,
      });
    } catch {
      return null;
    }
  }, [state.files, state.rush, state.appliedPromo]);

  // Continue button gating
  const { canContinue, blockedReason } = useMemo(() => {
    if (state.files.length === 0) {
      return { canContinue: false, blockedReason: null };
    }
    const parsing = state.files.find((f) => f.parse.status === 'parsing');
    if (parsing) {
      return {
        canContinue: false,
        blockedReason: 'Wait for parsing to finish.',
      };
    }
    const errored = state.files.find((f) => f.parse.status === 'error');
    if (errored) {
      return {
        canContinue: false,
        blockedReason: 'One or more files failed to parse.',
      };
    }
    const oversized = state.files.find((f) => {
      if (f.parse.status !== 'done') return false;
      const [x, y, z] = f.parse.result.bboxSize;
      return x > 256 || y > 256 || z > 256;
    });
    if (oversized) {
      return {
        canContinue: false,
        blockedReason: 'Resolve build-envelope warnings before continuing.',
      };
    }
    return { canContinue: true, blockedReason: null };
  }, [state.files]);

  const [checkout, setCheckout] = useState<CheckoutState>({ phase: 'idle' });
  const busy =
    checkout.phase === 'creating' ||
    checkout.phase === 'awaiting' ||
    checkout.phase === 'confirming';

  const onContinue = useCallback(async () => {
    const doneFiles = state.files.filter((f) => f.parse.status === 'done');
    // M2 checkout creates one order per file; multi-file orders are a later phase.
    // Submitting only one file would mismatch the displayed multi-file total, so
    // we block it rather than charge a wrong amount.
    if (doneFiles.length !== 1) {
      setCheckout({
        phase: 'error',
        message: 'Checkout currently supports a single file per order. Multi-file orders are coming soon.',
      });
      return;
    }
    const row = doneFiles[0];
    const file = row ? filesRef.current.get(row.id) : undefined;
    if (!row || !file) {
      setCheckout({ phase: 'error', message: 'Could not read the uploaded file. Please re-add it.' });
      return;
    }

    setCheckout({ phase: 'creating' });
    try {
      // The SERVER reprices from its own volume measurement; we send no amount.
      const order = await createOrder(file, row.config, {
        rush: state.rush,
        promo: state.appliedPromo,
      });
      await loadRazorpay();
      setCheckout({ phase: 'awaiting' });
      openCheckout({
        order,
        onSuccess: async () => {
          // NOT paid yet — the browser cannot self-confirm. Poll the server,
          // which flips to `paid` only after the signature-verified webhook.
          setCheckout({ phase: 'confirming', code: order.order_code });
          const outcome = await pollUntilPaid(order.order_code);
          setCheckout(
            outcome === 'paid'
              ? { phase: 'paid', code: order.order_code }
              : { phase: 'confirming', code: order.order_code },
          );
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

  return (
    <Container>
      <div className={styles.intro}>
        <p className={`h-eyebrow ${styles.eyebrow}`}>QUOTE · LIVE CALCULATOR</p>
        <h1 className={`display ${styles.heroHeadline}`}>Drop a file. See a price.</h1>
        <p className={`lede ${styles.heroLede}`}>
          STLs are parsed in your browser via Web Worker. Nothing leaves
          this device until you click checkout. The number on the right
          is the number you pay — including 18% GST and 2% payment
          processing.
        </p>
      </div>

      {checkout.phase !== 'idle' && (
        <div
          role="status"
          aria-live="polite"
          style={{
            margin: '0 0 1.5rem',
            padding: '0.85rem 1.1rem',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.14)',
            background:
              checkout.phase === 'paid'
                ? 'rgba(34,197,94,0.12)'
                : checkout.phase === 'error'
                  ? 'rgba(239,68,68,0.12)'
                  : 'rgba(255,255,255,0.06)',
            fontSize: '0.95rem',
            lineHeight: 1.5,
          }}
        >
          {checkout.phase === 'creating' && 'Creating your order…'}
          {checkout.phase === 'awaiting' && 'Opening the secure Razorpay window…'}
          {checkout.phase === 'confirming' && (
            <>
              <strong>Payment received — confirming with our server.</strong> Your order isn’t marked
              paid until we verify the payment. This updates automatically (order {checkout.code}).
            </>
          )}
          {checkout.phase === 'paid' && (
            <>
              <strong>Paid ✓</strong> Order {checkout.code} is confirmed. A confirmation email is on
              its way.
            </>
          )}
          {checkout.phase === 'error' && <>Checkout error: {checkout.message}</>}
        </div>
      )}

      <div className={styles.layout}>
        <div className={styles.left}>
          <Dropzone
            existingCount={state.files.length}
            onAccept={onAcceptFiles}
          />
          {state.files.length > 0 && (
            <div className={styles.fileList}>
              {(() => {
                // Precompute id -> lineSubtotal map once per render so
                // each FileCard lookup is O(1) instead of O(n) per row.
                const subtotalById = new Map<string, number>();
                if (result) {
                  let liIdx = 0;
                  for (const f of state.files) {
                    if (f.parse.status !== 'done') continue;
                    const li = result.lineItems[liIdx];
                    if (li) subtotalById.set(f.id, li.lineSubtotalPaise);
                    liIdx++;
                  }
                }
                return state.files.map((row, i) => {
                  const file = filesRef.current.get(row.id);
                  if (!file) return null;
                  const lineSubtotalPaise = subtotalById.get(row.id) ?? null;
                  return (
                  <FileCard
                    key={row.id}
                    index={i}
                    row={row}
                    file={file}
                    onUpdateConfig={(patch) =>
                      dispatch({ type: 'UPDATE_CONFIG', id: row.id, patch })
                    }
                    onRemove={() => onRemove(row.id)}
                    lineSubtotalPaise={lineSubtotalPaise}
                  />
                  );
                });
              })()}
            </div>
          )}
        </div>

        <div className={styles.right}>
          <PriceBreakdown
            result={result}
            fileCount={state.files.filter((f) => f.parse.status === 'done').length}
            rush={state.rush}
            onToggleRush={() => dispatch({ type: 'TOGGLE_RUSH' })}
            promoInput={state.promoInput}
            onPromoInputChange={(value) =>
              dispatch({ type: 'SET_PROMO_INPUT', value })
            }
            appliedPromo={state.appliedPromo}
            promoError={state.promoError}
            onApplyPromo={() => dispatch({ type: 'APPLY_PROMO' })}
            onClearPromo={() => dispatch({ type: 'CLEAR_PROMO' })}
            canContinue={canContinue && !busy}
            onContinue={onContinue}
            blockedReason={blockedReason}
          />
        </div>
      </div>

      {result && (
        <div className={styles.mobileDock}>
          <div className={styles.mobileDockInner}>
            <div className={styles.mobileDockTotal}>
              <span className={styles.mobileDockLabel}>Total · incl. GST</span>
              <span className={styles.mobileDockValue}>
                {formatINR(result.grandTotalPaise)}
              </span>
            </div>
            <button
              type="button"
              className={styles.mobileDockCta}
              onClick={onContinue}
              disabled={!canContinue || busy}
            >
              Continue →
            </button>
          </div>
        </div>
      )}
    </Container>
  );
}

