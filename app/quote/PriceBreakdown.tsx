'use client';

import clsx from 'clsx';
import { formatINR, type PromoCode } from '@/lib/pricing';
import type { QuoteResult } from '@/lib/pricing';
import styles from './PriceBreakdown.module.css';

export interface PriceBreakdownProps {
  result: QuoteResult | null;
  fileCount: number;
  rush: boolean;
  onToggleRush: () => void;
  promoInput: string;
  onPromoInputChange: (value: string) => void;
  appliedPromo: PromoCode | null;
  promoError: string | null;
  onApplyPromo: () => void;
  onClearPromo: () => void;
  canContinue: boolean;
  onContinue: () => void;
  blockedReason: string | null;
}

export function PriceBreakdown({
  result,
  fileCount,
  rush,
  onToggleRush,
  promoInput,
  onPromoInputChange,
  appliedPromo,
  promoError,
  onApplyPromo,
  onClearPromo,
  canContinue,
  onContinue,
  blockedReason,
}: PriceBreakdownProps) {
  if (!result) {
    return (
      <aside className={`${styles.panel} glass-panel-dark`} aria-label="Price breakdown">
        <div className={styles.header}>
          <span>QUOTE · LIVE</span>
          <span>—</span>
        </div>
        <div className={styles.empty}>
          Add at least one STL to see a quote.
        </div>
      </aside>
    );
  }

  return (
    <aside className={`${styles.panel} glass-panel-dark`} aria-label="Price breakdown">
      <div className={styles.header}>
        <span>QUOTE · LIVE</span>
        <span>{fileCount} FILE{fileCount === 1 ? '' : 'S'}</span>
      </div>
      <div className={styles.body}>
        {result.lineItems.map((li, i) => (
          <div key={i} className={styles.row}>
            <span className={styles.rowLabel}>
              File {String(i + 1).padStart(2, '0')} · qty {li.qty}
              {li.qtyDiscountPct > 0 ? ` · ${(li.qtyDiscountPct * 100).toFixed(0)}% off` : ''}
            </span>
            <span className={styles.rowValue}>
              {formatINR(li.lineSubtotalPaise)}
            </span>
          </div>
        ))}
        <div className={styles.row}>
          <span className={styles.rowLabel}>
            Setup · ₹100 × {fileCount}
          </span>
          <span className={styles.rowValue}>
            +{formatINR(result.setupTotalPaise)}
          </span>
        </div>

        {/* Rush row */}
        <div className={styles.rushRow}>
          <span className={styles.rowLabel}>Rush · queue jump · +25%</span>
          <button
            type="button"
            className={clsx(styles.rushButton, rush && styles.rushButtonOn)}
            aria-pressed={rush}
            onClick={onToggleRush}
          >
            {rush ? `+${formatINR(result.rushFeePaise)}` : 'Off'}
          </button>
        </div>

        {result.promoDiscountPaise > 0 && (
          <div className={`${styles.row} ${styles.rowDiscount}`}>
            <span className={styles.rowLabel}>
              Promo · {result.appliedPromo}
            </span>
            <span className={styles.rowValue}>
              −{formatINR(result.promoDiscountPaise)}
            </span>
          </div>
        )}

        {result.minTopUpPaise > 0 && (
          <div className={styles.row}>
            <span className={`${styles.rowLabel} ${styles.rowMuted}`}>
              Minimum order top-up
            </span>
            <span className={styles.rowValue}>
              +{formatINR(result.minTopUpPaise)}
            </span>
          </div>
        )}

        <div className={styles.subtotalRow}>
          <span className={styles.rowLabel}>Subtotal</span>
          <span className={styles.rowValue}>
            {formatINR(result.subtotalPaise)}
          </span>
        </div>

        <div className={styles.row}>
          <span className={styles.rowLabel}>
            Shipping {result.shippingPaise === 0 ? '(free above ₹2,500)' : '(under ₹2,500)'}
          </span>
          <span className={styles.rowValue}>
            +{formatINR(result.shippingPaise)}
          </span>
        </div>

        <div className={styles.row}>
          <span className={styles.rowLabel}>Payment processing · 2%</span>
          <span className={styles.rowValue}>
            +{formatINR(result.paymentFeePaise)}
          </span>
        </div>

        <div className={styles.promoSection}>
          <span className={styles.promoLabel}>Promo code</span>
          {appliedPromo ? (
            <div className={styles.promoApplied}>
              <span>{appliedPromo} applied</span>
              <button
                type="button"
                className={styles.promoClear}
                onClick={onClearPromo}
                aria-label="Clear promo code"
              >
                ×
              </button>
            </div>
          ) : (
            <>
              <div className={styles.promoForm}>
                <input
                  type="text"
                  className={styles.promoInput}
                  value={promoInput}
                  onChange={(e) => onPromoInputChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      onApplyPromo();
                    }
                  }}
                  placeholder="FIRSTPRINT"
                  aria-label="Promo code"
                />
                <button
                  type="button"
                  className={styles.promoApply}
                  onClick={onApplyPromo}
                  disabled={!promoInput.trim()}
                >
                  Apply
                </button>
              </div>
              {promoError && (
                <p className={styles.promoError} role="alert">
                  {promoError}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      <div className={styles.totalRow}>
        <span className={styles.totalLabel}>Grand total · incl. 18% GST</span>
        <span className={styles.totalValue}>
          {formatINR(result.grandTotalPaise)}
        </span>
      </div>

      <div className={styles.body}>
        <p className={styles.gstNote}>
          INCLUDES 18% GST · CGST/SGST OR IGST SPLIT AT CHECKOUT
        </p>
        <button
          type="button"
          className={styles.continueButton}
          onClick={onContinue}
          disabled={!canContinue}
        >
          Continue to checkout →
        </button>
        {!canContinue && blockedReason && (
          <p className={styles.continueHelper}>{blockedReason}</p>
        )}
      </div>
    </aside>
  );
}
