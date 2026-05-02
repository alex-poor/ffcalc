// compare.jsx — Screen 4: Comparison View
const { Button, ICONS, STREAM_KEYS, STREAM_LABELS, STREAM_COLORS, Money, VarianceChip } = window;

function Comparison({ state, setState, onOpenWorkbench, onBack, pushToast, flsTopSlice }) {
  const [mode, setMode] = React.useState(() => {
    try { return localStorage.getItem('ffcalc:v1:cmp-mode') || 'scenarios'; } catch { return 'scenarios'; }
  });
  React.useEffect(() => { try { localStorage.setItem('ffcalc:v1:cmp-mode', mode); } catch {} }, [mode]);

  return (
    <div className="content wide">
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 20 }}>
        <Button variant="ghost" onClick={onBack} icon={<ICONS.ArrowBack/>}>Register</Button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 4 }}>Comparison</h1>
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            {mode === 'scenarios'
              ? 'Side-by-side scenarios · up to 4 · highlights the best offer per row'
              : 'thePHO offer vs the practice’s current PHO · one practice · exportable as PDF'}
          </div>
        </div>
        <div className="seg">
          <button className={mode === 'scenarios' ? 'on' : ''} onClick={() => setMode('scenarios')}>Scenarios</button>
          <button className={mode === 'vsCurrent' ? 'on' : ''} onClick={() => setMode('vsCurrent')}>vs Current PHO</button>
        </div>
      </div>

      {mode === 'scenarios'
        ? <ScenarioCompare state={state} setState={setState} onOpenWorkbench={onOpenWorkbench} pushToast={pushToast} flsTopSlice={flsTopSlice}/>
        : <VsCurrentCompare state={state} setState={setState} onOpenWorkbench={onOpenWorkbench} pushToast={pushToast} flsTopSlice={flsTopSlice}/>}
    </div>
  );
}

function ScenarioCompare({ state, setState, onOpenWorkbench, pushToast, flsTopSlice }) {
  const [picker, setPicker] = React.useState(false);
  const ids = state.compareIds.slice(0, 4);
  const scenarios = ids.map(id => state.scenarios.find(s => s.id === id)).filter(Boolean);

  const rows = scenarios.map(sc => {
    const p = state.practices.find(x => x.id === sc.practiceId);
    if (!p) return null;
    const r = window.ffCompute(p);
    // Honour the FL lock — if top-slice is off, FL retention is 0 regardless of what the scenario stored.
    const eff = { ...sc.retention, firstLevel: flsTopSlice ? sc.retention.firstLevel : 0 };
    const offers = {}; const retained = {};
    STREAM_KEYS.forEach(k => {
      const ret = eff[k] || 0;          // default to 0% retention for streams not in saved scenario (e.g. u14)
      retained[k] = r.streams[k].total * ret / 100;
      offers[k] = r.streams[k].total - retained[k];
    });
    const totalOffer = Object.values(offers).reduce((s, v) => s + v, 0);
    const totalRet = Object.values(retained).reduce((s, v) => s + v, 0);
    return { scenario: sc, practice: p, result: r, offers, retained, totalOffer, totalRet, eff };
  }).filter(Boolean);

  const remove = (id) => setState(s => ({ ...s, compareIds: s.compareIds.filter(x => x !== id) }));
  const add = (id) => {
    if (state.compareIds.includes(id)) return;
    if (state.compareIds.length >= 4) { pushToast({ msg: 'Up to 4 scenarios can be compared' }); return; }
    setState(s => ({ ...s, compareIds: [...s.compareIds, id] }));
    setPicker(false);
  };

  const availableToAdd = state.scenarios.filter(s => !state.compareIds.includes(s.id));
  const maxOffer = Math.max(...rows.map(r => r.totalOffer), 0);
  // Hide rows for streams that are $0 across every scenario in view (typically the inactive
  // zero-fees scheme) — keeps the table compact when comparing practices on the same scheme.
  const visibleStreamKeys = STREAM_KEYS.filter(k => rows.some(r => r.result.streams[k].total > 0));

  return (
    <>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, justifyContent: 'flex-end' }}>
        <Button onClick={() => setPicker(true)} icon={<ICONS.Plus/>} disabled={rows.length >= 4}>Add scenario</Button>
        <Button onClick={() => pushToast({msg: 'Comparison CSV exported'})} icon={<ICONS.Download/>}>Export CSV</Button>
      </div>

      {rows.length === 0 ? (
        <div className="card"><div className="card-body" style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ color: 'var(--text-muted)', marginBottom: 14 }}>No scenarios in comparison yet.</div>
          <Button variant="primary" icon={<ICONS.Plus/>} onClick={() => setPicker(true)}>Add scenario</Button>
        </div></div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <table className="table" style={{ tableLayout: 'fixed' }}>
            <thead>
              <tr>
                <th style={{ width: 200 }}></th>
                {rows.map(r => (
                  <th key={r.scenario.id} style={{ verticalAlign: 'top', padding: '14px 16px', background: 'var(--surface-2)' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-strong)', fontSize: 14, textTransform: 'none', letterSpacing: 0, whiteSpace: 'normal' }}>
                          {r.scenario.name}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400, marginTop: 2, textTransform: 'none', letterSpacing: 0 }}>
                          {r.practice.name} · {window.fmtNumber(r.result.totalPatients)} enrolled
                        </div>
                      </div>
                      <button className="btn ghost icon sm" onClick={() => remove(r.scenario.id)} title="Remove">
                        <ICONS.X size={13}/>
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <SectionHeader label="PHO revenue (gross)" cols={rows.length}/>
              {visibleStreamKeys.map(k => (
                <tr key={k}>
                  <td style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: STREAM_COLORS[k] }}/>
                    {STREAM_LABELS[k]}
                  </td>
                  {rows.map(r => (
                    <td key={r.scenario.id} className="num">{window.fmtCurrency(r.result.streams[k].total)}</td>
                  ))}
                </tr>
              ))}
              <tr style={{ background: 'var(--surface-2)' }}>
                <td style={{ fontWeight: 600 }}>Total gross</td>
                {rows.map(r => (
                  <td key={r.scenario.id} className="num" style={{ fontWeight: 600 }}>{window.fmtCurrency(r.result.grandTotal)}</td>
                ))}
              </tr>

              <SectionHeader label="Pass-through %" cols={rows.length}/>
              {visibleStreamKeys.map(k => (
                <tr key={k}>
                  <td style={{ color: 'var(--text-muted)' }}>{STREAM_LABELS[k]}</td>
                  {rows.map(r => (
                    <td key={r.scenario.id} className="num">{100 - (r.eff[k] || 0)}%</td>
                  ))}
                </tr>
              ))}

              <SectionHeader label="Offer to practice" cols={rows.length}/>
              {visibleStreamKeys.map(k => (
                <tr key={k}>
                  <td style={{ color: 'var(--text-muted)' }}>{STREAM_LABELS[k]}</td>
                  {rows.map(r => (
                    <td key={r.scenario.id} className="num">{window.fmtCurrency(r.offers[k])}</td>
                  ))}
                </tr>
              ))}
              <tr style={{ background: 'var(--pink-soft)' }}>
                <td style={{ fontWeight: 700, color: 'var(--accent)' }}>Total offer</td>
                {rows.map(r => {
                  const isMax = r.totalOffer === maxOffer && rows.length > 1;
                  return (
                    <td key={r.scenario.id} className="num" style={{ fontWeight: 700, color: 'var(--accent)', fontSize: 15 }}>
                      {window.fmtCurrency(r.totalOffer)}
                      {isMax && <span style={{ marginLeft: 6, fontSize: 10, verticalAlign: 'middle', background: 'var(--accent)', color: 'white', padding: '2px 6px', borderRadius: 100, fontWeight: 600 }}>BEST</span>}
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td style={{ color: 'var(--text-muted)' }}>PHO retains</td>
                {rows.map(r => (
                  <td key={r.scenario.id} className="num">{window.fmtCurrency(r.totalRet)}</td>
                ))}
              </tr>

              <SectionHeader label="Variance vs current PHO" cols={rows.length}/>
              {visibleStreamKeys.map(k => (
                <tr key={k}>
                  <td style={{ color: 'var(--text-muted)' }}>{STREAM_LABELS[k]}</td>
                  {rows.map(r => {
                    const base = r.practice.baseline?.[k];
                    if (base == null) return <td key={r.scenario.id} style={{ color: 'var(--text-dim)', fontSize: 12 }} className="num">no baseline</td>;
                    const delta = r.offers[k] - base;
                    return <td key={r.scenario.id} className="num"><VarianceChip value={delta}/></td>;
                  })}
                </tr>
              ))}

              <tr>
                <td></td>
                {rows.map(r => (
                  <td key={r.scenario.id}>
                    <Button size="sm" onClick={() => onOpenWorkbench(r.practice.id)}>Open workbench<ICONS.Arrow size={12}/></Button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <window.Modal open={picker} title="Add scenario to comparison" onClose={() => setPicker(false)}
        footer={<Button variant="ghost" onClick={() => setPicker(false)}>Close</Button>}>
        {availableToAdd.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>All saved scenarios are already in the comparison.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {availableToAdd.map(sc => {
              const p = state.practices.find(x => x.id === sc.practiceId);
              return (
                <button key={sc.id} onClick={() => add(sc.id)} style={{
                  textAlign: 'left', padding: '10px 12px',
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 'var(--r)', cursor: 'pointer',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--surface)'}>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>{sc.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p?.name}</div>
                </button>
              );
            })}
          </div>
        )}
      </window.Modal>
    </>
  );
}

// Default retention used if user hasn't picked a scenario:
//   90% pass-through on flexible streams; First-Level always 100% pass unless
//   top-slice is enabled (Tweaks → Advanced).
const DEFAULT_RETENTION = { firstLevel: 0, u14: 0, u6: 0, contingent: 15, hop: 10, sia: 10, careplus: 10 };

function VsCurrentCompare({ state, setState, onOpenWorkbench, pushToast, flsTopSlice }) {
  const [practiceId, setPracticeId] = React.useState(() => {
    try { return localStorage.getItem('ffcalc:v1:cmp-vs-pid') || state.practices[0]?.id || ''; }
    catch { return state.practices[0]?.id || ''; }
  });
  // Default to no scenario (uses DEFAULT_RETENTION). User can still pick one.
  const [scenarioId, setScenarioId] = React.useState(null);

  React.useEffect(() => { try { localStorage.setItem('ffcalc:v1:cmp-vs-pid', practiceId || ''); } catch {} }, [practiceId]);

  const practice = state.practices.find(p => p.id === practiceId);
  const practiceScenarios = practice ? state.scenarios.filter(s => s.practiceId === practice.id).sort((a, b) => b.created - a.created) : [];

  // Reset scenario selection when switching practices (back to "default").
  React.useEffect(() => { setScenarioId(null); }, [practiceId]);

  if (state.practices.length === 0) {
    return <div className="card"><div className="card-body" style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
      Add a practice first to use this comparison.
    </div></div>;
  }

  if (!practice) {
    return <div className="card"><div className="card-body" style={{ padding: 24 }}>
      <SelectPractice state={state} value={practiceId} onChange={setPracticeId}/>
    </div></div>;
  }

  const rawRetention = (practiceScenarios.find(s => s.id === scenarioId)?.retention) || DEFAULT_RETENTION;
  // Honour the FL lock when top-slice is off.
  const retention = { ...rawRetention, firstLevel: flsTopSlice ? rawRetention.firstLevel : 0 };
  const result = window.ffCompute(practice);
  const offers = {}; const retained = {};
  STREAM_KEYS.forEach(k => {
    const ret = retention[k] || 0;
    retained[k] = result.streams[k].total * ret / 100;
    offers[k] = result.streams[k].total - retained[k];
  });
  const totalOffer = Object.values(offers).reduce((s, v) => s + v, 0);
  const baseline = practice.baseline || {};
  const baselineTotals = STREAM_KEYS.reduce((acc, k) => (acc[k] = baseline[k] ?? null, acc), {});
  const baselineTotal = STREAM_KEYS.reduce((s, k) => s + (baseline[k] || 0), 0);
  const hasAnyBaseline = STREAM_KEYS.some(k => baseline[k] != null);

  const exportPDF = () => {
    if (!window.ffPDF) { pushToast({ msg: 'PDF engine unavailable — rebuild FFCalc to enable' }); return; }
    buildVsCurrentPDF({ practice, result, retention, offers, retained, baseline, totalOffer, baselineTotal, scenarioName: practiceScenarios.find(s => s.id === scenarioId)?.name });
    pushToast({ msg: 'PDF saved' });
  };

  return (
    <>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: 14, alignItems: 'end', padding: '16px 20px' }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Practice</label>
            <SelectPractice state={state} value={practiceId} onChange={setPracticeId}/>
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Offer scenario</label>
            <select className="input" value={scenarioId || ''} onChange={e => setScenarioId(e.target.value || null)}>
              <option value="">— default ({flsTopSlice ? '90% all streams' : '100% First-Level, 90% flexible'}) —</option>
              {practiceScenarios.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <Button onClick={() => onOpenWorkbench(practice.id)} icon={<ICONS.Scale/>}>Workbench</Button>
          <Button variant="primary" onClick={exportPDF} icon={<ICONS.File/>} disabled={!hasAnyBaseline} title={hasAnyBaseline ? 'Export PDF' : 'Add current PHO figures in the editor to enable PDF export'}>
            Export PDF
          </Button>
        </div>
      </div>

      {!hasAnyBaseline && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-body" style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 12 }}>
            <ICONS.Warn size={18} style={{ color: 'var(--amber)' }}/>
            <div style={{ flex: 1, fontSize: 13.5, color: 'var(--text-muted)' }}>
              <b style={{ color: 'var(--text-strong)' }}>{practice.name}</b> has no current-PHO figures recorded.
              Open the editor and fill in the <i>Current PHO offer</i> section to run this comparison.
            </div>
            <Button onClick={() => onOpenWorkbench(practice.id)}>Workbench</Button>
          </div>
        </div>
      )}

      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="card-head" style={{ padding: '14px 18px' }}>
          <h3>{practice.name}</h3>
          <span className="sub" style={{ marginLeft: 'auto', color: 'var(--text-dim)' }}>
            {window.fmtNumber(result.totalPatients)} enrolled · scenario: {practiceScenarios.find(s => s.id === scenarioId)?.name || '90% default'}
          </span>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 200 }}>Stream</th>
              <th className="num">Current PHO</th>
              <th className="num">thePHO offer</th>
              <th className="num">Difference</th>
              <th className="num">Pass-through %</th>
            </tr>
          </thead>
          <tbody>
            {STREAM_KEYS.filter(k => result.streams[k].total > 0 || (baselineTotals[k] || 0) > 0).map(k => {
              const base = baselineTotals[k];
              const offer = offers[k];
              const delta = base != null ? offer - base : null;
              return (
                <tr key={k}>
                  <td style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: STREAM_COLORS[k] }}/>
                    <span style={{ color: 'var(--text-strong)', fontWeight: 500 }}>{STREAM_LABELS[k]}</span>
                  </td>
                  <td className="num">{base != null ? window.fmtCurrency(base) : <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>—</span>}</td>
                  <td className="num">{window.fmtCurrency(offer)}</td>
                  <td className="num">{delta != null ? <VarianceChip value={delta}/> : <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>—</span>}</td>
                  <td className="num">{100 - (retention[k] || 0)}%</td>
                </tr>
              );
            })}
            <tr style={{ background: 'var(--pink-soft)' }}>
              <td style={{ fontWeight: 700, color: 'var(--accent)' }}>Total</td>
              <td className="num" style={{ fontWeight: 600 }}>{hasAnyBaseline ? window.fmtCurrency(baselineTotal) : '—'}</td>
              <td className="num" style={{ fontWeight: 700, color: 'var(--accent)' }}>{window.fmtCurrency(totalOffer)}</td>
              <td className="num">{hasAnyBaseline ? <VarianceChip value={totalOffer - baselineTotal}/> : '—'}</td>
              <td className="num">{Math.round(100 - (totalOffer > 0 ? (result.grandTotal - totalOffer) / result.grandTotal * 100 : 0))}%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

function SelectPractice({ state, value, onChange }) {
  return (
    <select className="input" value={value || ''} onChange={e => onChange(e.target.value)}>
      {state.practices.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
    </select>
  );
}

// ASCII-only so jsPDF's built-in Helvetica renders cleanly (no U+2212, arrows, em-dash, etc.).
function fmtPdfMoney(n) {
  if (!isFinite(n)) return '-';
  return '$' + Math.round(n).toLocaleString('en-NZ');
}
function fmtPdfSigned(n) {
  if (!isFinite(n)) return '-';
  const sign = n >= 0 ? '+' : '-';
  return sign + '$' + Math.round(Math.abs(n)).toLocaleString('en-NZ');
}

function buildVsCurrentPDF({ practice, result, retention, offers, retained, baseline, totalOffer, baselineTotal, scenarioName }) {
  const { jsPDF, autoTable } = window.ffPDF;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });

  const pageW = doc.internal.pageSize.getWidth();
  const margin = 40;
  const contentW = pageW - margin * 2;
  let y = margin;

  // Header
  doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.setTextColor(31);
  doc.text('thePHO offer vs current PHO', margin, y); y += 22;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(12); doc.setTextColor(90);
  doc.text(practice.name, margin, y); y += 16;
  doc.setFontSize(9); doc.setTextColor(130);
  const subLine = [
    window.fmtNumber(result.totalPatients) + ' enrolled',
    practice.practiceType === 'Access' ? 'VLCA / Access' : 'Non-Access',
    'Scenario: ' + (scenarioName || '90% default pass-through'),
    'Generated ' + new Date().toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' }),
  ].join('  |  ');
  doc.text(subLine, margin, y); y += 20;

  // Summary row — 3 stat boxes side-by-side
  const boxH = 64;
  const boxW = (contentW - 16) / 3;
  const delta = totalOffer - baselineTotal;
  const boxes = [
    { label: 'CURRENT PHO (TOTAL)',   value: fmtPdfMoney(baselineTotal), color: [31, 31, 31] },
    { label: 'THEPHO OFFER (TOTAL)',  value: fmtPdfMoney(totalOffer),    color: [194, 61, 65] },
    { label: 'DIFFERENCE',            value: fmtPdfSigned(delta),        color: delta >= 0 ? [45, 189, 182] : [194, 61, 65] },
  ];
  boxes.forEach((b, i) => {
    const bx = margin + i * (boxW + 8);
    doc.setFillColor(253, 230, 232);
    doc.roundedRect(bx, y, boxW, boxH, 6, 6, 'F');
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(110);
    doc.text(b.label, bx + 14, y + 18);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(17);
    doc.setTextColor(b.color[0], b.color[1], b.color[2]);
    doc.text(b.value, bx + 14, y + 44);
  });
  y += boxH + 18;

  // Stream table — hide rows that are $0 in both engine output and baseline
  // (typically the inactive zero-fees scheme).
  const rows = window.STREAM_KEYS
    .filter(k => result.streams[k].total > 0 || (baseline[k] || 0) > 0)
    .map(k => {
      const b = baseline[k];
      const offer = offers[k];
      const ret = retained[k];
      const d = b != null ? offer - b : null;
      const pct = 100 - (retention[k] || 0);
      return [
        window.STREAM_LABELS[k],
        b != null ? fmtPdfMoney(b) : 'n/a',
        fmtPdfMoney(offer),
        d != null ? fmtPdfSigned(d) : 'n/a',
        pct + '%',
        fmtPdfMoney(ret),
      ];
    });

  autoTable(doc, {
    startY: y,
    head: [['Stream', 'Current PHO\n($/yr)', 'thePHO offer\n($/yr)', 'Difference', 'Pass %', 'PHO retains\n($/yr)']],
    body: rows,
    foot: [[
      'Total',
      fmtPdfMoney(baselineTotal),
      fmtPdfMoney(totalOffer),
      fmtPdfSigned(delta),
      Math.round((totalOffer / result.grandTotal) * 100) + '%',
      fmtPdfMoney(result.grandTotal - totalOffer),
    ]],
    styles: { font: 'helvetica', fontSize: 10, cellPadding: 6, overflow: 'linebreak', valign: 'middle' },
    headStyles: { fillColor: [236, 236, 236], textColor: 40, fontStyle: 'bold', halign: 'right', fontSize: 9.5, cellPadding: { top: 6, bottom: 6, left: 6, right: 6 } },
    footStyles: { fillColor: [253, 230, 232], textColor: 194, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 80, fontStyle: 'bold', halign: 'left' },
      1: { cellWidth: 95, halign: 'right' },
      2: { cellWidth: 95, halign: 'right' },
      3: { cellWidth: 95, halign: 'right' },
      4: { cellWidth: 55, halign: 'right' },
      5: { cellWidth: 'auto', halign: 'right' },
    },
    didParseCell: (data) => {
      // Left-align the "Stream" header to match its column.
      if (data.section === 'head' && data.column.index === 0) data.cell.styles.halign = 'left';
    },
    margin: { left: margin, right: margin },
  });

  y = doc.lastAutoTable.finalY + 20;

  // Gross revenue line
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(110);
  const gross = result.grandTotal;
  doc.text(
    'Te Whatu Ora to thePHO revenue for this practice: ' + fmtPdfMoney(gross) + '. '
    + 'thePHO retains ' + fmtPdfMoney(gross - totalOffer)
    + ' (' + Math.round(((gross - totalOffer) / gross) * 100) + '%) to cover PHO operations.',
    margin, y, { maxWidth: contentW });
  y += 24;

  // Method / notes
  doc.setTextColor(135); doc.setFontSize(8);
  const footer = 'Revenue figures derived from Te Whatu Ora capitation rates effective 1 July 2025, applied to '
               + window.fmtNumber(result.totalPatients)
               + ' enrolled patients using the practice demographic mix. '
               + 'Current-PHO figures were entered manually into FFCalc for this practice. '
               + 'Offer = thePHO revenue x pass-through per stream.';
  doc.text(footer, margin, y, { maxWidth: contentW });

  const safeName = practice.name.replace(/[^\w\s-]/g, '').trim() || 'practice';
  doc.save('thePHO vs current - ' + safeName + '.pdf');
}

function SectionHeader({ label, cols }) {
  return (
    <tr>
      <td colSpan={cols + 1} style={{
        padding: '14px 14px 6px',
        fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em',
        color: 'var(--text-dim)', fontWeight: 700,
        background: 'transparent', border: 'none',
      }}>{label}</td>
    </tr>
  );
}

window.Comparison = Comparison;
