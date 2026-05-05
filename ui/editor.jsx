// editor.jsx — Screen 2: Practice Editor

const { Button, ICONS, AGE_BANDS } = window;

const ETHNICITIES = ['maori-pacific', 'other'];
const DEP_BANDS = ['dep1-8', 'dep9-10'];
const GENDERS = ['F', 'M'];

function jointKey(ab, g, eth, dep) { return `${ab}|${g}|${eth}|${dep}`; }

function seedJointFromMarginals(ageCounts, femaleCount, maoriPacificCount, dep9to10Count) {
  const out = {};
  const total = AGE_BANDS.reduce((s, b) => s + (ageCounts[b] || 0), 0);
  if (total === 0) return out;
  const pF = (femaleCount ?? total * 0.5) / total;
  const pMP = (maoriPacificCount || 0) / total;
  const pDep = (dep9to10Count || 0) / total;
  for (const ab of AGE_BANDS) {
    const ac = ageCounts[ab] || 0;
    for (const g of GENDERS) {
      const pG = g === 'F' ? pF : 1 - pF;
      for (const eth of ETHNICITIES) {
        const pE = eth === 'maori-pacific' ? pMP : 1 - pMP;
        for (const dep of DEP_BANDS) {
          const pD = dep === 'dep9-10' ? pDep : 1 - pDep;
          out[jointKey(ab, g, eth, dep)] = Math.round(ac * pG * pE * pD);
        }
      }
    }
  }
  return out;
}

function sumJointForBand(joint, ab) {
  let s = 0;
  for (const g of GENDERS) for (const eth of ETHNICITIES) for (const dep of DEP_BANDS) {
    s += joint[jointKey(ab, g, eth, dep)] || 0;
  }
  return s;
}
function sumJointByDim(joint, filter) {
  let s = 0;
  for (const ab of AGE_BANDS) for (const g of GENDERS) for (const eth of ETHNICITIES) for (const dep of DEP_BANDS) {
    if (filter(ab, g, eth, dep)) s += joint[jointKey(ab, g, eth, dep)] || 0;
  }
  return s;
}

function PracticeEditor({ practiceId, state, setState, onSave, onOpenWorkbench, onBack, pushToast, pushHistory, isNew }) {
  const existing = state.practices.find(p => p.id === practiceId);
  const [draft, setDraft] = React.useState(() => existing ? JSON.parse(JSON.stringify(existing)) : {
    id: 'p-' + Math.random().toString(36).slice(2, 9),
    name: '',
    practiceType: 'NonAccess',
    ageCounts: { '0-4': 0, '5-14': 0, '15-24': 0, '25-44': 0, '45-64': 0, '65+': 0 },
    femaleCount: null,
    maoriPacificCount: 0,
    dep9to10Count: 0,
    huhcCount: null,
    cscCount: 0,
    useJoint: false,
    jointCounts: {},
    baseline: null,
    created: Date.now(),
    modified: Date.now(),
  });
  const [showBaseline, setShowBaseline] = React.useState(!!draft.baseline);

  const marginalTotal = AGE_BANDS.reduce((s, b) => s + (draft.ageCounts[b] || 0), 0);
  const jointTotalCount = Object.values(draft.jointCounts || {}).reduce((s, v) => s + (v || 0), 0);
  const total = draft.useJoint ? jointTotalCount : marginalTotal;
  const femaleCount = draft.femaleCount ?? total * 0.5;
  const femalePct = total > 0 ? femaleCount / total : 0.5;

  const update = (patch) => setDraft(d => ({ ...d, ...patch, modified: Date.now() }));
  const updateAge = (band, v) => update({ ageCounts: { ...draft.ageCounts, [band]: Math.max(0, v || 0) }});

  const joint = draft.jointCounts || {};
  const setJointCell = (ab, g, eth, dep, v) => update({
    jointCounts: { ...joint, [jointKey(ab, g, eth, dep)]: Math.max(0, v || 0) },
  });
  const enableJoint = () => {
    const seed = Object.keys(joint).length > 0 ? joint : seedJointFromMarginals(draft.ageCounts, draft.femaleCount, draft.maoriPacificCount, draft.dep9to10Count);
    update({ useJoint: true, jointCounts: seed });
  };
  const disableJoint = () => {
    const j = draft.jointCounts || {};
    const hasCells = Object.values(j).some(v => v > 0);
    if (!hasCells) { update({ useJoint: false }); return; }
    const ageCounts = {};
    for (const ab of AGE_BANDS) ageCounts[ab] = sumJointForBand(j, ab);
    update({
      useJoint: false,
      ageCounts,
      femaleCount: sumJointByDim(j, (ab, g) => g === 'F'),
      maoriPacificCount: sumJointByDim(j, (ab, g, eth) => eth === 'maori-pacific'),
      dep9to10Count: sumJointByDim(j, (ab, g, eth, dep) => dep === 'dep9-10'),
    });
  };
  const reseedJoint = () => {
    update({ jointCounts: seedJointFromMarginals(draft.ageCounts, draft.femaleCount, draft.maoriPacificCount, draft.dep9to10Count) });
    pushToast({ msg: 'Cross-tab reseeded from marginals' });
  };

  // Validation
  const errors = {};
  const warnings = {};
  if (!draft.name.trim()) errors.name = 'Practice name is required';
  if (!draft.useJoint) {
    if (draft.maoriPacificCount > total) errors.mp = 'Cannot exceed total';
    if (draft.dep9to10Count > total) errors.dep = 'Cannot exceed total';
    if (femaleCount > total) errors.female = 'Cannot exceed total';
    if (total > 0 && (femalePct < 0.4 || femalePct > 0.6)) warnings.female = `${(femalePct * 100).toFixed(0)}% female seems unusual`;
  }
  if ((draft.cscCount || 0) > total) errors.csc = 'Cannot exceed total';

  const hasErrors = Object.keys(errors).length > 0;

  const save = (thenOpen) => {
    if (hasErrors) {
      pushToast({ msg: 'Fix validation errors first' });
      return;
    }
    pushHistory();
    setState(s => {
      const idx = s.practices.findIndex(p => p.id === draft.id);
      const practices = idx >= 0
        ? s.practices.map(p => p.id === draft.id ? draft : p)
        : [...s.practices, draft];
      return { ...s, practices, activePracticeId: draft.id };
    });
    pushToast({ msg: isNew ? 'Practice created' : 'Saved changes' });
    if (thenOpen) onOpenWorkbench(draft.id);
    else onSave();
  };

  // Paste handler for age strip: split on tab/comma/newline
  const onAgePaste = (e) => {
    const txt = (e.clipboardData || window.clipboardData).getData('text');
    const parts = txt.split(/[\t,\s]+/).map(s => parseInt(s.replace(/[^0-9]/g, ''), 10)).filter(n => !isNaN(n));
    if (parts.length >= 2) {
      e.preventDefault();
      const next = { ...draft.ageCounts };
      AGE_BANDS.forEach((b, i) => { if (parts[i] != null) next[b] = parts[i]; });
      update({ ageCounts: next });
      pushToast({ msg: `Pasted ${parts.length} values into age strip` });
    }
  };

  return (
    <div className="content narrow">
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 24 }}>
        <Button variant="ghost" onClick={onBack} icon={<ICONS.ArrowBack/>}>Register</Button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 4 }}>
            {isNew ? 'New practice' : draft.name || 'Untitled practice'}
          </h1>
          <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Define the practice's enrolled-patient demographics. All figures annual, aggregated.
          </div>
        </div>
        {isNew ? (
          <Button variant="primary" onClick={() => save(true)} disabled={hasErrors}>
            Save & open workbench<ICONS.Arrow size={15}/>
          </Button>
        ) : (
          <Button variant="primary" onClick={() => save(false)} disabled={hasErrors} icon={<ICONS.Save/>}>Save</Button>
        )}
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-head"><h3>Practice</h3></div>
        <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 24 }}>
          <div className="field">
            <label>Practice name</label>
            <input className={'input' + (errors.name ? ' error' : '')}
              placeholder="e.g. Hataitai Family Doctors"
              value={draft.name} onChange={e => update({ name: e.target.value })}/>
            {errors.name && <div className="hint error">{errors.name}</div>}
          </div>
          <div className="field">
            <label>Practice type</label>
            <div className="seg" style={{ alignSelf: 'flex-start' }}>
              <button className={draft.practiceType === 'Access' ? 'on' : ''} onClick={() => update({ practiceType: 'Access' })}>VLCA · Access</button>
              <button className={draft.practiceType === 'NonAccess' ? 'on' : ''} onClick={() => update({ practiceType: 'NonAccess' })}>Non-Access</button>
            </div>
            <div className="hint" style={{ fontSize: 11.5 }}>
              VLCA practices (Very Low Cost Access) receive ~20% higher First-Level capitation.
            </div>
          </div>
          <div className="field">
            <label>Zero-fees scheme</label>
            <div className="seg" style={{ alignSelf: 'flex-start' }}>
              <button className={(draft.zeroFeesScheme || 'u14') === 'u14' ? 'on' : ''} onClick={() => update({ zeroFeesScheme: 'u14' })}>Under-14s</button>
              <button className={draft.zeroFeesScheme === 'u6' ? 'on' : ''} onClick={() => update({ zeroFeesScheme: 'u6' })}>Under-6s</button>
            </div>
            <div className="hint" style={{ fontSize: 11.5 }}>
              Most modern practices are on Under-14s (extended scheme). Under-6s is the legacy default.
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-head">
          <h3>Enrolment & demographics</h3>
          <div className="seg" style={{ marginLeft: 'auto' }}>
            <button className={!draft.useJoint ? 'on' : ''} onClick={disableJoint}>Marginal totals</button>
            <button className={draft.useJoint ? 'on' : ''} onClick={enableJoint}>Cross-tab (joint)</button>
          </div>
        </div>
        <div className="card-body" style={{ padding: '14px 18px' }}>
          {!draft.useJoint ? (
            <>
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, marginBottom: 8, display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span>Age-band enrolment</span>
                  <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>· paste a row from Karo — tabs or commas will split</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 }} onPaste={onAgePaste}>
                  {AGE_BANDS.map(b => (
                    <div key={b} className="field">
                      <label style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{b}</label>
                      <input className="input num" type="number" min="0"
                        value={draft.ageCounts[b] || ''}
                        onChange={e => updateAge(b, parseInt(e.target.value, 10))}
                        placeholder="0"/>
                    </div>
                  ))}
                </div>
                <div style={{
                  marginTop: 14, padding: '14px 18px',
                  background: 'var(--pink-soft)', borderRadius: 'var(--r)',
                  display: 'flex', alignItems: 'baseline', gap: 18,
                }}>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Total enrolled</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent)', letterSpacing: '-0.01em' }} className="num">
                    {window.fmtNumber(total)}
                  </div>
                  <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>
                    Auto-computed · used as denominator for gender & ethnicity splits
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 18 }}>
                <div className="field">
                  <label>Female count <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>(optional — defaults 50%)</span></label>
                  <input className={'input num' + (errors.female ? ' error' : warnings.female ? ' warn' : '')}
                    type="number" min="0" placeholder={total ? String(Math.round(total * 0.5)) : '—'}
                    value={draft.femaleCount ?? ''} onChange={e => update({ femaleCount: e.target.value === '' ? null : parseInt(e.target.value, 10) })}/>
                  {errors.female && <div className="hint error">{errors.female}</div>}
                  {!errors.female && warnings.female && <div className="hint warn">⚠ {warnings.female}</div>}
                  {!errors.female && !warnings.female && total > 0 && (
                    <div className="hint">= {(femalePct * 100).toFixed(1)}% of enrolled</div>
                  )}
                </div>
                <div className="field">
                  <label>Māori + Pacific count</label>
                  <input className={'input num' + (errors.mp ? ' error' : '')}
                    type="number" min="0"
                    value={draft.maoriPacificCount || ''} onChange={e => update({ maoriPacificCount: parseInt(e.target.value, 10) || 0 })}/>
                  {errors.mp && <div className="hint error">{errors.mp}</div>}
                  {!errors.mp && total > 0 && <div className="hint">= {((draft.maoriPacificCount / total) * 100).toFixed(1)}% of enrolled</div>}
                </div>
                <div className="field">
                  <label>Quintile 5 (Dep 9-10) count</label>
                  <input className={'input num' + (errors.dep ? ' error' : '')}
                    type="number" min="0"
                    value={draft.dep9to10Count || ''} onChange={e => update({ dep9to10Count: parseInt(e.target.value, 10) || 0 })}/>
                  {errors.dep && <div className="hint error">{errors.dep}</div>}
                </div>
                <div className="field">
                  <label>Community Services Card count</label>
                  <input className={'input num' + (errors.csc ? ' error' : '')}
                    type="number" min="0"
                    value={draft.cscCount || ''} onChange={e => update({ cscCount: parseInt(e.target.value, 10) || 0 })}/>
                  {errors.csc && <div className="hint error">{errors.csc}</div>}
                </div>
                <div className="field" style={{ gridColumn: '1 / -1' }}>
                  <label>HUHC count <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>(optional)</span></label>
                  <input className="input num" type="number" min="0" style={{ maxWidth: 240 }}
                    value={draft.huhcCount ?? ''} onChange={e => update({ huhcCount: e.target.value === '' ? null : parseInt(e.target.value, 10) })}
                    placeholder="—"/>
                  <div className="hint">HUHC count is usually absent from Karo reports. Leave blank to treat as 0.</div>
                </div>
              </div>
            </>
          ) : (
            <JointCrossTab
              draft={draft} total={total} joint={joint}
              setJointCell={setJointCell} reseedJoint={reseedJoint}
              errors={errors} update={update}
            />
          )}
        </div>
      </div>

      {/* Baseline collapsible */}
      <div className="card">
        <button onClick={() => setShowBaseline(!showBaseline)} style={{
          width: '100%', textAlign: 'left', padding: '16px 20px', background: 'none', border: 'none',
          display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
          borderBottom: showBaseline ? '1px solid var(--border)' : 'none',
        }}>
          {showBaseline ? <ICONS.ChevronDown size={16}/> : <ICONS.Chevron size={16}/>}
          <h3 style={{ fontSize: 14, fontWeight: 600 }}>Current PHO offer — for variance display</h3>
          <span className="sub" style={{ color: 'var(--text-muted)', fontSize: 12.5 }}>
            Optional. Paste from the practice's existing arrangement.
          </span>
        </button>
        {showBaseline && (() => {
          // Hide the inactive zero-fees scheme so the baseline grid stays compact.
          const scheme = draft.zeroFeesScheme || 'u14';
          const visibleKeys = window.STREAM_KEYS.filter(k => k === scheme || (k !== 'u14' && k !== 'u6'));
          return (
            <div className="card-body" style={{ display: 'grid', gridTemplateColumns: `repeat(${visibleKeys.length}, 1fr)`, gap: 16 }}>
              {visibleKeys.map(k => (
                <div className="field" key={k}>
                  <label>{window.RATES_META[k].shortName} ($ / yr)</label>
                  <input className="input num" type="number" min="0"
                    value={draft.baseline?.[k] ?? ''}
                    onChange={e => update({
                      baseline: { ...(draft.baseline || {}), [k]: e.target.value === '' ? null : parseInt(e.target.value, 10) },
                    })}/>
                </div>
              ))}
            </div>
          );
        })()}
      </div>
    </div>
  );
}

function JointCrossTab({ draft, total, joint, setJointCell, reseedJoint, errors, update }) {
  const jointTotal = AGE_BANDS.reduce((s, ab) => s + sumJointForBand(joint, ab), 0);
  const derivedFemale = sumJointByDim(joint, (ab, g) => g === 'F');
  const derivedMP = sumJointByDim(joint, (ab, g, eth) => eth === 'maori-pacific');
  const derivedDep = sumJointByDim(joint, (ab, g, eth, dep) => dep === 'dep9-10');

  return (
    <div>
      <div style={{
        padding: '12px 14px', marginBottom: 14,
        background: 'var(--surface-2)', borderRadius: 'var(--r)',
        fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.55,
      }}>
        Each cell is the count of patients in that exact age × sex × ethnicity × deprivation combination.
        SIA and CarePlus funding use the joint distribution directly. To start from a marginal-totals approximation, switch to <b>Marginal totals</b>, fill them in, then switch back — or click <button className="btn ghost sm" style={{ padding: '2px 8px', fontSize: 11.5, display: 'inline-flex', marginLeft: 2, marginRight: 2 }} onClick={reseedJoint}>Reseed from marginals</button> to rebuild cells from any marginals already entered.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {AGE_BANDS.map(ab => {
          const bandSum = sumJointForBand(joint, ab);
          return (
            <div key={ab} style={{
              border: '1px solid var(--border)', borderRadius: 'var(--r)',
              background: 'var(--surface)', overflow: 'hidden',
            }}>
              <div style={{
                display: 'flex', alignItems: 'baseline', gap: 10,
                padding: '8px 12px', background: 'var(--surface-2)',
                fontSize: 13, borderBottom: '1px solid var(--border)',
              }}>
                <b style={{ color: 'var(--text-strong)' }}>Age {ab}</b>
                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                  cells sum: <b className="num" style={{ color: 'var(--text-strong)' }}>{window.fmtNumber(bandSum)}</b>
                </span>
              </div>
              <table className="table" style={{ fontSize: 12.5 }}>
                <thead>
                  <tr>
                    <th style={{ padding: '6px 12px', textAlign: 'left', width: 80 }}></th>
                    <th className="num" style={{ padding: '6px 8px' }}>M/P · Dep 1-8</th>
                    <th className="num" style={{ padding: '6px 8px' }}>M/P · Dep 9-10</th>
                    <th className="num" style={{ padding: '6px 8px' }}>Other · Dep 1-8</th>
                    <th className="num" style={{ padding: '6px 8px' }}>Other · Dep 9-10</th>
                  </tr>
                </thead>
                <tbody>
                  {GENDERS.map(g => (
                    <tr key={g}>
                      <td style={{ padding: '4px 12px', color: 'var(--text-muted)', fontWeight: 500 }}>
                        {g === 'F' ? 'Female' : 'Male'}
                      </td>
                      {ETHNICITIES.flatMap(eth => DEP_BANDS.map(dep => {
                        const v = joint[jointKey(ab, g, eth, dep)] ?? 0;
                        return (
                          <td key={`${eth}-${dep}`} style={{ padding: '4px 6px' }}>
                            <input className="input num" type="number" min="0"
                              style={{ padding: '4px 6px', fontSize: 12.5, textAlign: 'right' }}
                              value={v || ''} placeholder="0"
                              onChange={e => setJointCell(ab, g, eth, dep, parseInt(e.target.value, 10))}/>
                          </td>
                        );
                      }))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>

      <div style={{
        marginTop: 14, padding: '12px 14px',
        background: 'var(--pink-soft)', borderRadius: 'var(--r)',
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16,
      }}>
        <DerivedStat label="Total enrolled" value={jointTotal} sub="sum of all cells"/>
        <DerivedStat label="Female" value={derivedFemale} sub={jointTotal ? `${((derivedFemale / jointTotal) * 100).toFixed(0)}%` : ''}/>
        <DerivedStat label="Māori + Pacific" value={derivedMP} sub={jointTotal ? `${((derivedMP / jointTotal) * 100).toFixed(0)}%` : ''}/>
        <DerivedStat label="Dep 9-10" value={derivedDep} sub={jointTotal ? `${((derivedDep / jointTotal) * 100).toFixed(0)}%` : ''}/>
      </div>

      <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 18 }}>
        <div className="field">
          <label>Community Services Card count</label>
          <input className={'input num' + (errors.csc ? ' error' : '')}
            type="number" min="0"
            value={draft.cscCount || ''} onChange={e => update({ cscCount: parseInt(e.target.value, 10) || 0 })}/>
          <div className="hint">CSC is tracked as a marginal — applied across all joint cells.</div>
        </div>
        <div className="field">
          <label>HUHC count <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>(optional)</span></label>
          <input className="input num" type="number" min="0"
            value={draft.huhcCount ?? ''} onChange={e => update({ huhcCount: e.target.value === '' ? null : parseInt(e.target.value, 10) })}
            placeholder="—"/>
          <div className="hint">Leave blank to treat as 0.</div>
        </div>
      </div>
    </div>
  );
}

function DerivedStat({ label, value, sub }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</div>
      <div className="num" style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-strong)', marginTop: 2 }}>{window.fmtNumber(value)}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

window.PracticeEditor = PracticeEditor;
