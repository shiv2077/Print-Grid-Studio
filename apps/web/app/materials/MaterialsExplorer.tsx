'use client';

import { Fragment, useMemo, useState } from 'react';
import { formatINR } from '@printgrid/pricing';
import { MATERIAL_TABLE, FLEXIBILITIES, type MaterialInfo, type Flexibility } from '@/lib/materials-data';

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
      <div className="cmp-controls">
        <input
          className="cmp-search"
          type="text"
          placeholder="Search materials or uses…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search materials"
        />
        <div className="cmp-chips" role="group" aria-label="Filter by flexibility">
          {(['All', ...FLEXIBILITIES] as const).map((f) => (
            <button
              key={f}
              type="button"
              className={'cmp-chip' + (flex === f ? ' is-active' : '')}
              aria-pressed={flex === f}
              onClick={() => setFlex(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="cmp-table-wrap">
        <table className="cmp-table">
          <thead>
            <tr>
              {COLUMNS.map((c) => (
                <th
                  key={c.key}
                  className={c.numeric ? 'is-num' : ''}
                  aria-sort={sortKey === c.key ? (asc ? 'ascending' : 'descending') : 'none'}
                >
                  <button type="button" className="cmp-sort" onClick={() => toggleSort(c.key)}>
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
                  className={'cmp-row' + (openKey === m.key ? ' is-open' : '')}
                  tabIndex={0}
                  role="button"
                  aria-expanded={openKey === m.key}
                  onClick={() => toggleOpen(m.key)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleOpen(m.key); }
                  }}
                >
                  {COLUMNS.map((c) => (
                    <td key={c.key} className={c.numeric ? 'is-num mono' : ''}>{c.render(m)}</td>
                  ))}
                  <td>{m.flexibility}</td>
                </tr>
                {openKey === m.key && (
                  <tr className="cmp-detail-row">
                    <td colSpan={COLUMNS.length + 1}>
                      <div className="cmp-detail">
                        <p className="cmp-detail__use">{m.use}</p>
                        <div className="cmp-detail__specs">
                          <span><span className="cmp-detail__k">Finish</span> {m.finish}</span>
                          <span><span className="cmp-detail__k">Cost</span> {formatINR(m.ratePerGramPaise)}/g</span>
                          <span><span className="cmp-detail__k">Density</span> {m.density} g/cm³</span>
                          <span><span className="cmp-detail__k">Tensile</span> {m.tensileMpa} MPa</span>
                          <span><span className="cmp-detail__k">Max temp</span> {m.maxTempC} °C</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length + 1} className="cmp-empty">No materials match that filter.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
