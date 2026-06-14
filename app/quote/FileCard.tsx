'use client';

import dynamic from 'next/dynamic';
import clsx from 'clsx';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { MaterialDropdown } from './MaterialDropdown';
import {
  computeMass,
  formatINR,
  type Finish,
  type LayerHeight,
} from '@/lib/pricing';
import type { FileRow, FileRowConfig } from './state';
import styles from './FileCard.module.css';

// Dynamic import — keeps Three.js + R3F out of the initial bundle.
const StlViewer = dynamic(
  () => import('./StlViewer').then((m) => m.StlViewer),
  {
    ssr: false,
    loading: () => <div className={styles.viewerPlaceholder} />,
  }
);

const LAYER_OPTIONS = [
  { value: '0.12', label: '0.12' },
  { value: '0.16', label: '0.16' },
  { value: '0.20', label: '0.20' },
  { value: '0.24', label: '0.24' },
  { value: '0.28', label: '0.28' },
] as const satisfies ReadonlyArray<{ value: LayerHeight; label: string }>;

const FINISH_OPTIONS = [
  { value: 'as-printed', label: 'As-printed' },
  { value: 'sanded', label: 'Sanded' },
  { value: 'primer', label: 'Primer' },
  { value: 'gloss', label: 'Gloss' },
] as const satisfies ReadonlyArray<{ value: Finish; label: string }>;

const ENVELOPE_MM = 256;

export interface FileCardProps {
  index: number;
  row: FileRow;
  file: File; // raw File kept outside reducer for serializability
  onUpdateConfig: (patch: Partial<FileRowConfig>) => void;
  onRemove: () => void;
  /** Pricing-engine line subtotal for this file (already in paise).
   *  Null while parsing or on error. */
  lineSubtotalPaise: number | null;
}

export function FileCard({
  index,
  row,
  file,
  onUpdateConfig,
  onRemove,
  lineSubtotalPaise,
}: FileCardProps) {
  const sizeMb = (row.fileSize / (1024 * 1024)).toFixed(2);
  const parse = row.parse;

  const exceedsEnvelope =
    parse.status === 'done' &&
    (parse.result.bboxSize[0] > ENVELOPE_MM ||
      parse.result.bboxSize[1] > ENVELOPE_MM ||
      parse.result.bboxSize[2] > ENVELOPE_MM);

  const massGrams =
    parse.status === 'done'
      ? computeMass(parse.result.volumeMm3, row.config.materialKey)
      : null;

  return (
    <article className={styles.card}>
      <div className={styles.viewerSlot}>
        {parse.status === 'done' ? (
          <StlViewer
            file={file}
            materialKey={row.config.materialKey}
            triangleCount={parse.result.triangleCount}
          />
        ) : parse.status === 'error' ? (
          <div
            className={`${styles.viewerPlaceholder} ${styles.viewerPlaceholderError}`}
          >
            Parse failed
          </div>
        ) : (
          <div className={styles.viewerPlaceholder}>Parsing…</div>
        )}
      </div>

      <div className={styles.controls}>
        <div className={styles.headerRow}>
          <div className={styles.headerInfo}>
            <p className={styles.fileName}>
              {String(index + 1).padStart(2, '0')} · {row.fileName}
            </p>
            <p className={styles.fileMeta}>{sizeMb} MB</p>
          </div>
          <button
            type="button"
            className={styles.removeBtn}
            onClick={onRemove}
            aria-label={`Remove ${row.fileName}`}
          >
            Remove
          </button>
        </div>

        {parse.status === 'parsing' && (
          <div className={styles.parsingBanner}>Parsing geometry…</div>
        )}
        {parse.status === 'error' && (
          <div className={styles.errorBanner}>
            Could not parse: {parse.message}
          </div>
        )}

        {parse.status === 'done' && (
          <>
            <div className={styles.statRow}>
              <div className={styles.stat}>
                <span className={styles.statLabel}>Triangles</span>
                <span className={styles.statValue}>
                  {parse.result.triangleCount.toLocaleString('en-IN')}
                </span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>Bbox · X×Y×Z</span>
                <span className={styles.statValue}>
                  {parse.result.bboxSize.map((n) => n.toFixed(1)).join(' × ')} mm
                </span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>Est. mass</span>
                <span className={styles.statValue}>
                  {massGrams !== null ? `${massGrams.toFixed(1)} g` : '—'}
                </span>
              </div>
            </div>

            {exceedsEnvelope && (
              <div className={styles.warningBanner} role="alert">
                <span className={styles.warningGlyph} aria-hidden>
                  ⚠
                </span>
                <p className={styles.warningHeading}>
                  EXCEEDS BUILD ENVELOPE
                </p>
                <p className={styles.warningBody}>
                  Bounding box larger than 256 mm in at least one axis.
                  Split the part into multiple pieces or message us
                  directly — we can plan the seams.
                </p>
              </div>
            )}

            <div className={styles.controlGroup}>
              <span className={styles.controlLabel}>Material</span>
              <MaterialDropdown
                value={row.config.materialKey}
                onChange={(materialKey) => onUpdateConfig({ materialKey })}
                ariaLabel="Material for this file"
              />
            </div>

            <div className={styles.controlGroup}>
              <span className={styles.controlLabel}>Layer height (mm)</span>
              <SegmentedControl
                options={LAYER_OPTIONS}
                value={row.config.layerHeight}
                onChange={(layerHeight) => onUpdateConfig({ layerHeight })}
                ariaLabel="Layer height in millimetres"
                mono
              />
            </div>

            <div className={styles.controlGroup}>
              <span className={styles.controlLabel}>Finish</span>
              <SegmentedControl
                options={FINISH_OPTIONS}
                value={row.config.finish}
                onChange={(finish) => onUpdateConfig({ finish })}
                ariaLabel="Finish style"
              />
            </div>

            <div className={styles.qtyRow}>
              <div className={styles.controlGroup}>
                <span className={styles.controlLabel}>Quantity</span>
                <div className={styles.qtyInputWrap}>
                  <button
                    type="button"
                    className={styles.qtyButton}
                    onClick={() =>
                      onUpdateConfig({
                        qty: Math.max(1, row.config.qty - 1),
                      })
                    }
                    aria-label="Decrease quantity"
                    disabled={row.config.qty <= 1}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={999}
                    value={row.config.qty}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      onUpdateConfig({
                        qty: Number.isFinite(v) ? Math.max(1, Math.min(999, v)) : 1,
                      });
                    }}
                    className={styles.qtyInput}
                    aria-label="Quantity"
                  />
                  <button
                    type="button"
                    className={styles.qtyButton}
                    onClick={() =>
                      onUpdateConfig({
                        qty: Math.min(999, row.config.qty + 1),
                      })
                    }
                    aria-label="Increase quantity"
                    disabled={row.config.qty >= 999}
                  >
                    +
                  </button>
                </div>
              </div>
              <div className={styles.controlGroup}>
                <span className={styles.controlLabel}>Multicolour</span>
                <div
                  className={clsx(
                    styles.multicolorRow,
                    row.config.multicolor && styles.multicolorRowOn
                  )}
                >
                  <div className={styles.multicolorLabel}>
                    <p className={styles.multicolorTitle}>AMS · 4 colours</p>
                    <p className={styles.multicolorHint}>+20% per file</p>
                  </div>
                  <button
                    type="button"
                    className={clsx(
                      styles.multicolorToggle,
                      row.config.multicolor && styles.multicolorToggleOn
                    )}
                    aria-pressed={row.config.multicolor}
                    onClick={() =>
                      onUpdateConfig({ multicolor: !row.config.multicolor })
                    }
                  >
                    {row.config.multicolor ? 'On' : 'Off'}
                  </button>
                </div>
              </div>
            </div>

            <div className={styles.subtotalRow}>
              <span className={styles.subtotalLabel}>This file</span>
              <span className={styles.subtotalValue}>
                {lineSubtotalPaise !== null
                  ? formatINR(lineSubtotalPaise)
                  : '—'}
              </span>
            </div>
          </>
        )}
      </div>
    </article>
  );
}
