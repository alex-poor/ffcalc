// editor.jsx — Screen 2: Practice Editor

const { Button, ICONS, AGE_BANDS } = window;

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
    baseline: null,
    created: Date.now(),
    modified: Date.now(),
  });
  const [showBaseline, setShowBaseline] = React.useState(!!draft.baseline);

  const total = AGE_BANDS.reduce((s, b) => s + (draft.ageCounts[b] || 0), 0);
  const femaleCount = draft.femaleCount ?? total * 0.5;
  const femalePct = total > 0 ? femaleCount / total : 0.5;

  const update = (patch) => setDraft(d => ({ ...d, ...patch, modified: Date.now() }));
  const updateAge = (band, v) => update({ ageCounts: { ...draft.ageCounts, [band]: Math.max(0, v || 0) }});

  // Validation
  const errors = {};
  const warnings = {};
  if (!draft.name.trim()) errors.name = 'Practice name is required';
  if (draft.maoriPacificCount > total) errors.mp = 'Cannot exceed total';
  if (draft.dep9to10Count > total) errors.dep = 'Cannot exceed total';
  if ((draft.cscCount || 0) > total) errors.csc = 'Cannot exceed total';
  if (femaleCount > total) errors.female = 'Cannot exceed total';
  if (total > 0 && (femalePct < 0.4 || femalePct > 0.6)) warnings.female = `${(femalePct * 100).toFixed(0)}% female seems unusual`;

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
    <div className="content" style={{ maxWidth: 1040 }}>
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
        <Button onClick={() => save(false)} disabled={hasErrors} icon={<ICONS.Save/>}>Save</Button>
        <Button variant="primary" onClick={() => save(true)} disabled={hasErrors}>
          Save & open workbench<ICONS.Arrow size={15}/>
        </Button>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-head"><h3>Practice</h3></div>
        <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
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
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-head">
          <h3>Age-band enrolment</h3>
          <span className="sub" style={{ marginLeft: 'auto' }}>Paste a row from Karo — tabs or commas will split into bands</span>
        </div>
        <div className="card-body">
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
            marginTop: 18, padding: '14px 18px',
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
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-head"><h3>Marginal counts</h3></div>
        <div className="card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 18 }}>
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
        {showBaseline && (
          <div className="card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {['firstLevel', 'hop', 'sia', 'careplus'].map(k => (
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
        )}
      </div>
    </div>
  );
}

window.PracticeEditor = PracticeEditor;
