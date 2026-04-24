// network.jsx — Screen 7: Network-wide rollup across all practices

const { Button, ICONS, STREAM_KEYS, STREAM_LABELS, STREAM_COLORS, Money, StackedBar, VarianceChip } = window;

function Network({ state, onBack, onOpenWorkbench, pushToast }) {
  const [retention, setRetention] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem('ffcalc:v1:network-ret')) || { firstLevel: 10, hop: 10, sia: 10, careplus: 10 }; }
    catch { return { firstLevel: 10, hop: 10, sia: 10, careplus: 10 }; }
  });
  const [mgmtPlan, setMgmtPlan] = React.useState(() => {
    try { const v = localStorage.getItem('ffcalc:v1:network-mgmt-plan'); return v == null ? true : v === '1'; }
    catch { return true; }
  });
  React.useEffect(() => { try { localStorage.setItem('ffcalc:v1:network-ret', JSON.stringify(retention)); } catch {} }, [retention]);
  React.useEffect(() => { try { localStorage.setItem('ffcalc:v1:network-mgmt-plan', mgmtPlan ? '1' : '0'); } catch {} }, [mgmtPlan]);

  const practiceRows = React.useMemo(() => state.practices.map(p => {
    const r = window.ffCompute(p);
    const retained = {}; const offers = {};
    STREAM_KEYS.forEach(k => {
      retained[k] = r.streams[k].total * retention[k] / 100;
      offers[k] = r.streams[k].total - retained[k];
    });
    const totalOffer = Object.values(offers).reduce((s, v) => s + v, 0);
    const totalRet = Object.values(retained).reduce((s, v) => s + v, 0);
    const baselineTotal = p.baseline
      ? STREAM_KEYS.reduce((s, k) => s + (p.baseline[k] || 0), 0)
      : null;
    return { practice: p, result: r, offers, retained, totalOffer, totalRet, baselineTotal };
  }), [state.practices, retention]);

  const network = React.useMemo(() => {
    const gross = { firstLevel: 0, hop: 0, sia: 0, careplus: 0 };
    const retainedByStream = { firstLevel: 0, hop: 0, sia: 0, careplus: 0 };
    const offerByStream = { firstLevel: 0, hop: 0, sia: 0, careplus: 0 };
    let patients = 0;
    let baselineKnownTotal = 0;
    let baselineKnownPractices = 0;
    for (const row of practiceRows) {
      patients += row.result.totalPatients;
      for (const k of STREAM_KEYS) {
        gross[k] += row.result.streams[k].total;
        retainedByStream[k] += row.retained[k];
        offerByStream[k] += row.offers[k];
      }
      if (row.baselineTotal != null) {
        baselineKnownTotal += row.baselineTotal;
        baselineKnownPractices++;
      }
    }
    const streamGrossTotal = Object.values(gross).reduce((s, v) => s + v, 0);
    const streamRetainedTotal = Object.values(retainedByStream).reduce((s, v) => s + v, 0);
    const offerTotal = Object.values(offerByStream).reduce((s, v) => s + v, 0);
    const mgmt = window.ffComputeManagement(patients, mgmtPlan);
    const grossTotal = streamGrossTotal + mgmt.total;
    const retainedTotal = streamRetainedTotal + mgmt.total; // management services is PHO-retained in full
    return {
      patients, gross, retainedByStream, offerByStream,
      streamGrossTotal, streamRetainedTotal,
      grossTotal, retainedTotal, offerTotal,
      mgmt,
      baselineKnownTotal, baselineKnownPractices,
    };
  }, [practiceRows, mgmtPlan]);

  const setRet = (stream, v) => setRetention(r => ({ ...r, [stream]: v }));
  const setAllRet = (v) => setRetention({ firstLevel: v, hop: v, sia: v, careplus: v });
  const masterRet = Math.round((retention.firstLevel + retention.hop + retention.sia + retention.careplus) / 4);

  if (state.practices.length === 0) {
    return (
      <div className="content">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 20 }}>
          <Button variant="ghost" onClick={onBack} icon={<ICONS.ArrowBack/>}>Register</Button>
          <div><h1 style={{ fontSize: 22, fontWeight: 600 }}>Network</h1></div>
        </div>
        <div className="card"><div className="card-body" style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
          Add at least one practice to see a network rollup.
        </div></div>
      </div>
    );
  }

  return (
    <div className="content wide">
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 20 }}>
        <Button variant="ghost" onClick={onBack} icon={<ICONS.ArrowBack/>}>Register</Button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 4 }}>Network</h1>
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            All {state.practices.length} practices · total enrolled {window.fmtNumber(network.patients)} ·
            set a network-wide pass-through to see retained / offered dollars at portfolio level.
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body" style={{ padding: 20, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
          <Stat label="Enrolled" value={window.fmtNumber(network.patients)} sub={`${state.practices.length} practices`}/>
          <Stat label="Gross PHO revenue (yr)"
            value={window.fmtCurrency(network.grossTotal)}
            sub={`includes ${window.fmtCurrency(network.mgmt.total, { compact: true })} management services`}/>
          <Stat label="PHO retains" value={window.fmtCurrency(network.retainedTotal)} sub={`${((network.retainedTotal / network.grossTotal) * 100 || 0).toFixed(1)}% weighted`}/>
          <Stat label="Offer to practices" value={window.fmtCurrency(network.offerTotal)} sub={`${window.fmtCurrency(network.offerTotal / 12, { compact: true })}/mo`} accent/>
        </div>
        <div style={{ padding: '0 20px 20px' }}>
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 10 }}>
            Network revenue composition
          </div>
          <StackedBar items={[
            ...STREAM_KEYS.map(k => ({ label: STREAM_LABELS[k], value: network.gross[k], color: STREAM_COLORS[k] })),
            { label: 'Management', value: network.mgmt.total, color: 'var(--navy)' },
          ]} height={10} showLabels/>
        </div>
      </div>

      <ManagementServicesCard mgmt={network.mgmt} patients={network.patients} hasPlan={mgmtPlan} setHasPlan={setMgmtPlan}/>

      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 16 }}>
        <div className="card" style={{ alignSelf: 'start', position: 'sticky', top: 80 }}>
          <div className="card-head" style={{ padding: '12px 16px' }}>
            <h3>Network pass-through</h3>
            <span className="sub" style={{ marginLeft: 'auto', color: 'var(--text-dim)' }}>Applied to every practice</span>
          </div>
          <div className="card-body" style={{ padding: '8px 16px 16px' }}>
            <SliderRow label="Apply to all" retention={masterRet} onChange={setAllRet} master/>
            <SliderRow label="First-Level" retention={retention.firstLevel} onChange={(v) => setRet('firstLevel', v)} color={STREAM_COLORS.firstLevel}/>
            <SliderRow label="HOP" retention={retention.hop} onChange={(v) => setRet('hop', v)} color={STREAM_COLORS.hop}/>
            <SliderRow label="SIA" retention={retention.sia} onChange={(v) => setRet('sia', v)} color={STREAM_COLORS.sia}/>
            <SliderRow label="CarePlus" retention={retention.careplus} onChange={(v) => setRet('careplus', v)} color={STREAM_COLORS.careplus}/>
          </div>
          <div style={{ padding: '0 16px 16px' }}>
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.04em', fontWeight: 600, textTransform: 'uppercase' }}>
              Retained $ by stream
            </div>
            <table className="table" style={{ fontSize: 12.5 }}>
              <tbody>
                {STREAM_KEYS.map(k => (
                  <tr key={k}>
                    <td style={{ padding: '6px 0', border: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: STREAM_COLORS[k] }}/>
                      <span style={{ color: 'var(--text-muted)' }}>{STREAM_LABELS[k]}</span>
                    </td>
                    <td className="num" style={{ padding: '6px 0', border: 'none', textAlign: 'right', fontWeight: 500 }}>
                      {window.fmtCurrency(network.retainedByStream[k], { compact: true })}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td style={{ padding: '6px 0', border: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--navy)' }}/>
                    <span style={{ color: 'var(--text-muted)' }}>Management</span>
                  </td>
                  <td className="num" style={{ padding: '6px 0', border: 'none', textAlign: 'right', fontWeight: 500 }}>
                    {window.fmtCurrency(network.mgmt.total, { compact: true })}
                  </td>
                </tr>
                <tr style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: '8px 0 0', border: 'none', fontWeight: 600, color: 'var(--text-strong)' }}>Total retained</td>
                  <td className="num" style={{ padding: '8px 0 0', border: 'none', textAlign: 'right', fontWeight: 700, color: 'var(--accent)' }}>
                    {window.fmtCurrency(network.retainedTotal, { compact: true })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-head" style={{ padding: '12px 16px' }}>
            <h3>Per-practice contribution</h3>
            <span className="sub" style={{ marginLeft: 'auto', color: 'var(--text-dim)' }}>At the network pass-through set above</span>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Practice</th>
                <th className="num">Enrolled</th>
                <th className="num">Gross</th>
                <th className="num">Offer</th>
                <th className="num">Retained</th>
                <th className="num">Current PHO</th>
                <th className="num">Variance</th>
                <th style={{ width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {practiceRows.map(row => {
                const variance = row.baselineTotal != null ? row.totalOffer - row.baselineTotal : null;
                return (
                  <tr key={row.practice.id} className="row-click" onClick={() => onOpenWorkbench(row.practice.id)}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-strong)' }}>{row.practice.name}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-dim)', marginTop: 1 }}>
                        {row.practice.practiceType === 'Access' ? 'VLCA / Access' : 'Non-Access'}
                      </div>
                    </td>
                    <td className="num">{window.fmtNumber(row.result.totalPatients)}</td>
                    <td className="num">{window.fmtCurrency(row.result.grandTotal, { compact: true })}</td>
                    <td className="num" style={{ color: 'var(--accent)', fontWeight: 500 }}>
                      {window.fmtCurrency(row.totalOffer, { compact: true })}
                    </td>
                    <td className="num">{window.fmtCurrency(row.totalRet, { compact: true })}</td>
                    <td className="num">
                      {row.baselineTotal != null
                        ? window.fmtCurrency(row.baselineTotal, { compact: true })
                        : <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>—</span>}
                    </td>
                    <td className="num">
                      {variance != null ? <VarianceChip value={variance}/> : <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>—</span>}
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <button className="btn ghost icon sm" onClick={() => onOpenWorkbench(row.practice.id)} title="Open in workbench">
                        <ICONS.Arrow size={13}/>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: 'var(--pink-soft)' }}>
                <td style={{ fontWeight: 700, color: 'var(--accent)' }}>Practice totals</td>
                <td className="num" style={{ fontWeight: 600 }}>{window.fmtNumber(network.patients)}</td>
                <td className="num" style={{ fontWeight: 600 }}>{window.fmtCurrency(network.streamGrossTotal, { compact: true })}</td>
                <td className="num" style={{ fontWeight: 700, color: 'var(--accent)' }}>{window.fmtCurrency(network.offerTotal, { compact: true })}</td>
                <td className="num" style={{ fontWeight: 600 }}>{window.fmtCurrency(network.streamRetainedTotal, { compact: true })}</td>
                <td className="num" style={{ fontWeight: 600 }}>
                  {network.baselineKnownPractices > 0
                    ? window.fmtCurrency(network.baselineKnownTotal, { compact: true })
                    : <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>—</span>}
                </td>
                <td className="num">
                  {network.baselineKnownPractices === state.practices.length
                    ? <VarianceChip value={network.offerTotal - network.baselineKnownTotal}/>
                    : <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>
                        {network.baselineKnownPractices}/{state.practices.length} with baseline
                      </span>}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-dim)', fontSize: 12 }}>
        <ICONS.Info size={13}/>
        Applies one network-wide pass-through to every practice. To model per-practice differentiation, save practice-level scenarios and use the Comparison screen.
      </div>
    </div>
  );
}

function ManagementServicesCard({ mgmt, patients, hasPlan, setHasPlan }) {
  const meta = window.MGMT_META;
  const tierLabels = { 0: '—', 1: 'Tier 1 (≤40,000)', 2: 'Tier 2 (40,001–75,000)', 3: 'Tier 3 (≥75,001)' };
  const perPerson = patients > 0 ? mgmt.total / patients : 0;
  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="card-head" style={{ padding: '12px 18px', alignItems: 'center' }}>
        <h3>{meta.name}</h3>
        <span className="sub" style={{ marginLeft: 8, color: 'var(--text-dim)' }}>PHO-level · not passed to practices</span>
        <span style={{ flex: 1 }}/>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--text-muted)', cursor: 'pointer' }}>
          <input type="checkbox" checked={hasPlan} onChange={e => setHasPlan(e.target.checked)}/>
          Management Services Plan approved
        </label>
      </div>
      <div className="card-body" style={{ padding: '14px 18px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24, marginBottom: 14 }}>
          <Stat label="Annual funding" value={window.fmtCurrency(mgmt.total)} sub={`${window.fmtCurrency(mgmt.total / 12, { compact: true })}/mo`} accent/>
          <Stat label="Tier" value={tierLabels[mgmt.tier] || '—'} sub={patients ? `${window.fmtNumber(patients)} enrolled network-wide` : 'no practices'}/>
          <Stat label="Effective per enrolee" value={window.fmtCurrency(perPerson, { decimals: 2 })} sub={`eff. ${meta.effective}`}/>
        </div>

        {mgmt.blocked && (
          <div style={{
            padding: '10px 12px', marginBottom: 12,
            background: 'color-mix(in oklab, var(--amber) 14%, var(--surface))',
            border: '1px solid color-mix(in oklab, var(--amber) 35%, var(--border))',
            borderRadius: 'var(--r)', fontSize: 12.5, color: 'var(--amber-strong, #8a5a00)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <window.ICONS.Warn size={13}/>
            {mgmt.note || 'Tier 1 funding requires an approved Management Services Plan. Tick the box above once the plan is approved.'}
          </div>
        )}

        {mgmt.breakdown.length > 0 && (
          <table className="table" style={{ fontSize: 12.5 }}>
            <thead>
              <tr>
                <th>Band</th>
                <th className="num">Enrolees</th>
                <th className="num">Rate / person</th>
                <th className="num">Amount</th>
              </tr>
            </thead>
            <tbody>
              {mgmt.breakdown.map((b, i) => (
                <tr key={i}>
                  <td style={{ color: 'var(--text-muted)' }}>{b.label}</td>
                  <td className="num">{window.fmtNumber(b.count)}</td>
                  <td className="num" style={{ color: 'var(--text-muted)' }}>{window.fmtCurrency(b.rate, { decimals: 4 })}</td>
                  <td className="num" style={{ fontWeight: 500 }}>{window.fmtCurrency(b.amount)}</td>
                </tr>
              ))}
              <tr style={{ background: 'var(--pink-soft)' }}>
                <td style={{ fontWeight: 700, color: 'var(--accent)' }}>Total</td>
                <td className="num" style={{ fontWeight: 600 }}>{window.fmtNumber(patients)}</td>
                <td></td>
                <td className="num" style={{ fontWeight: 700, color: 'var(--accent)' }}>{window.fmtCurrency(mgmt.total)}</td>
              </tr>
            </tbody>
          </table>
        )}

        <div style={{ marginTop: 10, fontSize: 11.5, color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <window.ICONS.Info size={12}/>
          {meta.notes}
          {' '}
          <a href={meta.sourceUrl} target="_blank" rel="noopener noreferrer"
            style={{ color: 'var(--accent)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 3, marginLeft: 4 }}>
            Source <window.ICONS.External size={11}/>
          </a>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, sub, accent }) {
  return (
    <div>
      <div style={{ fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
      <div className="num" style={{
        fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em',
        color: accent ? 'var(--accent)' : 'var(--text-strong)',
      }}>{value}</div>
      {sub && <div style={{ fontSize: 12.5, color: 'var(--text-dim)', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function SliderRow({ label, retention, onChange, color, master }) {
  const passThrough = 100 - retention;
  const handle = (pt) => onChange(100 - pt);
  return (
    <div className={'slider-row' + (master ? ' master' : '')} style={{ gridTemplateColumns: '96px 1fr 92px' }}>
      <div className="label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {color && !master && <span style={{ width: 8, height: 8, borderRadius: 2, background: color }}/>}
        {label}
      </div>
      <div style={{ position: 'relative' }}>
        <input type="range" min="0" max="100" step="1" value={passThrough} onChange={e => handle(parseInt(e.target.value, 10))}/>
      </div>
      <div className="value" title={`PHO retains ${retention}%`}>
        {passThrough}% <span style={{ color: 'var(--text-dim)', fontWeight: 400, fontSize: 11 }}>pass</span>
      </div>
    </div>
  );
}

window.Network = Network;
