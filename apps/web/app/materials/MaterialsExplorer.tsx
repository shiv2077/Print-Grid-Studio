// apps/web/app/materials/MaterialsExplorer.tsx
'use client';

import { Fragment, useMemo, useState } from 'react';
import clsx from 'clsx';
import { motion, useReducedMotion } from 'motion/react';
import { formatINR } from '@printgrid/pricing';
import { MATERIAL_TABLE, FLEXIBILITIES, type MaterialInfo, type Flexibility } from '@/lib/materials-data';
import styles from './MaterialsExplorer.module.css';

type SortKey = 'name' | 'ratePerGramPaise' | 'tensileMpa' | 'maxTempC' | 'density';

const COLUMNS: { key: SortKey; label: string; numeric: boolean; render: (m: MaterialInfo) => string }[] = [
  { key: 'name', label: 'Material', numeric: false, render: (m) => m.name },
  { key: 'ratePerGramPaise', label: 'Cost / g', numeric: true, render: (m) => formatINR(m.ratePerGramPaise) },
  { key: 'tensileMpa', label: 'Tensile', numeric: true, render: (m) => `${m.tensileMpa} MPa` },
  { key: 'maxTempC', label: 'Max temp', numeric: true, render: (m) => `${m.maxTempC} °C` },
  { key: 'density', label: 'Density', numeric: true, render: (m) => `${m.density} g/cm³` },
];

export function MaterialsExplorer() {
  const [q, setQ] = useState('');
  const [flex, setFlex] = useState<Flexibility | 'All'>('All');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [asc, setAsc] = useState(true);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const reduceMotion = useReducedMotion();

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const filtered = MATERIAL_TABLE.filter(
      (m) =>
        (flex === 'All' || m.flexibility === flex) &&
        (needle === '' || `${m.name} ${m.use} ${m.flexibility}`.toLowerCase().includes(needle)),
    );
    return [...filtered].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv));
      return asc ? cmp : -cmp;
    });
  }, [q, flex, sortKey, asc]);

  const toggleSort = (k: SortKey) => {
    if (k === sortKey) setAsc((a) => !a);
    else { setSortKey(k); setAsc(true); }
  };
  const toggleOpen = (k: string) => setOpenKey((cur) => (cur === k ? null : k));

  return (
    <>
      <div className={styles.controls}>
        <input
          className={styles.search}
          type="text"
          placeholder="Search materials or uses…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search materials"
        />
        <div className={styles.chips} role="group" aria-label="Filter by flexibility">
          {(['All', ...FLEXIBILITIES] as const).map((f) => (
            <button
              key={f}
              type="button"
              className={clsx(styles.chip, flex === f && styles.chipActive)}
              aria-pressed={flex === f}
              onClick={() => setFlex(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              {COLUMNS.map((c) => (
                <th
                  key={c.key}
                  className={c.numeric ? styles.numCol : undefined}
                  aria-sort={sortKey === c.key ? (asc ? 'ascending' : 'descending') : 'none'}
                >
                  <button type="button" className={styles.sortButton} onClick={() => toggleSort(c.key)}>
                    {c.label}
                    {sortKey === c.key ? (asc ? ' ▲' : ' ▼') : ''}
                  </button>
                </th>
              ))}
              <th>Flexibility</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <Fragment key={m.key}>
                <tr
                  className={clsx(styles.row, openKey === m.key && styles.rowOpen)}
                  tabIndex={0}
                  role="button"
                  aria-expanded={openKey === m.key}
                  onClick={() => toggleOpen(m.key)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleOpen(m.key); }
                  }}
                >
                  {COLUMNS.map((c) => (
                    <td key={c.key} className={c.numeric ? styles.numCell : undefined}>{c.render(m)}</td>
                  ))}
                  <td>{m.flexibility}</td>
                </tr>
                {openKey === m.key && (
                  <tr className={styles.detailRow}>
                    <td colSpan={COLUMNS.length + 1}>
                      <motion.div
                        className={styles.detail}
                        initial={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                        animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <p className={styles.detailUse}>{m.use}</p>
                        <div className={styles.detailSpecs}>
                          <span><span className={styles.detailKey}>Finish</span> {m.finish}</span>
                          <span><span className={styles.detailKey}>Cost</span> {formatINR(m.ratePerGramPaise)}/g</span>
                          <span><span className={styles.detailKey}>Density</span> {m.density} g/cm³</span>
                          <span><span className={styles.detailKey}>Tensile</span> {m.tensileMpa} MPa</span>
                          <span><span className={styles.detailKey}>Max temp</span> {m.maxTempC} °C</span>
                        </div>
                      </motion.div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length + 1} className={styles.empty}>No materials match that filter.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
