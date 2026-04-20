// compare.jsx — Screen 4: Comparison View
const { Button, ICONS, STREAM_KEYS, STREAM_LABELS, STREAM_COLORS, Money, VarianceChip } = window;

function Comparison({ state, setState, onOpenWorkbench, onBack, pushToast }) {
  const [picker, setPicker] = React.useState(false);
  const ids = state.compareIds.slice(0, 4);
  const scenarios = ids.map(id => state.scenarios.find(s => s.id === id)).filter(Boolean);

  const rows = scenarios.map(sc => {
    const p = state.practices.find(x => x.id === sc.practiceId);
    if (!p) return null;
    const r = window.ffCompute(p);
    const offers = {}; const retained = {};
    STREAM_KEYS.forEach(k => {
      retained[k] = r.streams[k].total * sc.retention[k] / 100;
      offers[k] = r.streams[k].total - retained[k];
    });
    const totalOffer = Object.values(offers).reduce((s, v) => s + v, 0);
    const totalRet = Object.values(retained).reduce((s, v) => s + v, 0);
    return { scenario: sc, practice: p, result: r, offers, retained, totalOffer, totalRet };
  }).filter(Boolean);

  const remove = (id) => setState(s => ({ ...s, compareIds: s.compareIds.filter(x => x !== id) }));
  const add = (id) => {
    if (state.compareIds.includes(id)) return;
    if (state.compareIds.length >= 4) { pushToast({ msg: 'Up to 4 scenarios can be compared' }); return; }
    setState(s => ({ ...s, compareIds: [...s.compareIds, id] }));
    setPicker(false);
  };

  const availableToAdd = state.scenarios.filter(s => !state.compareIds.includes(s.id));

  // Find max per row for highlight
  const maxOffer = Math.max(...rows.map(r => r.totalOffer), 0);

  return (
    <div className="content wide">
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 20 }}>
        <Button variant="ghost" onClick={onBack} icon={<ICONS.ArrowBack/>}>Register</Button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 4 }}>Comparison</h1>
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            Side-by-side scenarios · up to 4 · highlights the best offer per row
          </div>
        </div>
        <Button onClick={() => setPicker(true)} icon={<ICONS.Plus/>} disabled={rows.length >= 4}>Add scenario</Button>
        <Button onClick={() => pushToast({msg: 'Comparison CSV exported'})} icon={<ICONS.Download/>}>Export CSV</Button>
        <Button onClick={() => pushToast({msg: 'Comparison PDF exported'})} icon={<ICONS.File/>}>Export PDF</Button>
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
              {STREAM_KEYS.map(k => (
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
              {STREAM_KEYS.map(k => (
                <tr key={k}>
                  <td style={{ color: 'var(--text-muted)' }}>{STREAM_LABELS[k]}</td>
                  {rows.map(r => (
                    <td key={r.scenario.id} className="num">{100 - r.scenario.retention[k]}%</td>
                  ))}
                </tr>
              ))}

              <SectionHeader label="Offer to practice" cols={rows.length}/>
              {STREAM_KEYS.map(k => (
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
              {STREAM_KEYS.map(k => (
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
    </div>
  );
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
