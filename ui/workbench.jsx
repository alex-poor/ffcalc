// workbench.jsx — Screen 3: Scenario Workbench (primary)

const { Button, Modal, PromptModal, ConfirmModal, TypeChip, Money, VarianceChip, StackedBar, Sparkline, STREAM_COLORS, STREAM_KEYS, STREAM_LABELS, ICONS, AGE_BANDS } = window;

function Workbench({ practiceId, state, setState, onBack, onCompare, pushToast, pushHistory, layoutVariant, density }) {
  const practice = state.practices.find(p => p.id === practiceId);
  const [retention, setRetention] = React.useState({ firstLevel: 15, hop: 20, sia: 10, careplus: 15 });
  const [expanded, setExpanded] = React.useState({});
  const [saveOpen, setSaveOpen] = React.useState(false);
  const [scenarioName, setScenarioName] = React.useState('');
  const [selectedScenarioId, setSelectedScenarioId] = React.useState(null);

  // Load most recent scenario for this practice on mount / practice change
  React.useEffect(() => {
    const scenarios = state.scenarios.filter(s => s.practiceId === practiceId).sort((a, b) => b.created - a.created);
    if (scenarios.length) {
      setRetention(scenarios[0].retention);
      setSelectedScenarioId(scenarios[0].id);
    } else {
      setSelectedScenarioId(null);
    }
  }, [practiceId]);

  if (!practice) {
    return <div className="content"><p>Practice not found.</p><Button onClick={onBack}>Back</Button></div>;
  }

  const result = React.useMemo(() => window.ffCompute(practice), [practice]);

  const streamRetained = {
    firstLevel: result.streams.firstLevel.total * retention.firstLevel / 100,
    hop: result.streams.hop.total * retention.hop / 100,
    sia: result.streams.sia.total * retention.sia / 100,
    careplus: result.streams.careplus.total * retention.careplus / 100,
  };
  const streamOffer = {
    firstLevel: result.streams.firstLevel.total - streamRetained.firstLevel,
    hop: result.streams.hop.total - streamRetained.hop,
    sia: result.streams.sia.total - streamRetained.sia,
    careplus: result.streams.careplus.total - streamRetained.careplus,
  };
  const totalRetained = Object.values(streamRetained).reduce((s, v) => s + v, 0);
  const totalOffer = Object.values(streamOffer).reduce((s, v) => s + v, 0);
  const baselineTotal = practice.baseline
    ? (practice.baseline.firstLevel || 0) + (practice.baseline.hop || 0) + (practice.baseline.sia || 0) + (practice.baseline.careplus || 0)
    : null;
  const variance = baselineTotal != null ? totalOffer - baselineTotal : null;

  const setRet = (stream, v) => setRetention(r => ({ ...r, [stream]: v }));
  const setAllRet = (v) => setRetention({ firstLevel: v, hop: v, sia: v, careplus: v });
  const resetRet = () => { setRetention({ firstLevel: 0, hop: 0, sia: 0, careplus: 0 }); pushToast({ msg: 'Pass-through reset to 100%' }); };

  const masterRet = Math.round((retention.firstLevel + retention.hop + retention.sia + retention.careplus) / 4);

  const updatePractice = (patch) => {
    pushHistory();
    setState(s => ({
      ...s,
      practices: s.practices.map(p => p.id === practiceId ? { ...p, ...patch, modified: Date.now() } : p),
    }));
  };
  const updatePracticeAge = (band, v) => updatePractice({ ageCounts: { ...practice.ageCounts, [band]: Math.max(0, v || 0) } });

  const saveScenario = () => {
    if (!scenarioName.trim()) return;
    pushHistory();
    const sc = {
      id: 's-' + Math.random().toString(36).slice(2, 9),
      practiceId, name: scenarioName.trim(), retention: { ...retention }, created: Date.now(),
    };
    setState(s => ({ ...s, scenarios: [...s.scenarios, sc] }));
    setSelectedScenarioId(sc.id);
    pushToast({ msg: `Saved scenario: ${sc.name}` });
    setSaveOpen(false);
    setScenarioName('');
  };

  const renameScenario = (id, nextName) => {
    const trimmed = (nextName || '').trim();
    if (!trimmed) return;
    const existing = state.scenarios.find(s => s.id === id);
    if (!existing || existing.name === trimmed) return;
    pushHistory();
    setState(s => ({
      ...s,
      scenarios: s.scenarios.map(sc => sc.id === id ? { ...sc, name: trimmed } : sc),
    }));
    pushToast({ msg: `Renamed scenario to "${trimmed}"` });
  };

  const deleteScenario = (id) => {
    const sc = state.scenarios.find(s => s.id === id);
    if (!sc) return;
    pushHistory();
    setState(s => ({
      ...s,
      scenarios: s.scenarios.filter(x => x.id !== id),
      compareIds: s.compareIds.filter(x => x !== id),
    }));
    if (selectedScenarioId === id) setSelectedScenarioId(null);
    pushToast({ msg: `Deleted scenario: ${sc.name}`, action: { label: 'Undo' } });
  };

  const applyTemplate = (id) => {
    const t = (state.templates || []).find(x => x.id === id);
    if (!t) return;
    setRetention({ ...t.retention });
    setSelectedScenarioId(null);
    pushToast({ msg: `Applied template: ${t.name}` });
  };

  // Lifted modal state for prompt/confirm (replaces window.prompt/confirm)
  const [modal, setModal] = React.useState(null); // { kind: 'prompt'|'confirm', ...props }

  const saveCurrentAsTemplate = () => {
    setModal({
      kind: 'prompt',
      title: 'Save pass-through template',
      label: 'Template name',
      placeholder: 'e.g. Generous access rollover',
      confirmLabel: 'Save',
      onSubmit: (name) => {
        pushHistory();
        const t = {
          id: 't-' + Math.random().toString(36).slice(2, 9),
          name, retention: { ...retention },
        };
        setState(s => ({ ...s, templates: [...(s.templates || []), t] }));
        pushToast({ msg: `Saved template: ${t.name}` });
        setModal(null);
      },
    });
  };

  const renameTemplate = (id) => {
    const t = (state.templates || []).find(x => x.id === id);
    if (!t) return;
    setModal({
      kind: 'prompt',
      title: 'Rename template',
      label: 'Template name',
      initialValue: t.name,
      confirmLabel: 'Rename',
      onSubmit: (name) => {
        if (name !== t.name) {
          pushHistory();
          setState(s => ({
            ...s,
            templates: (s.templates || []).map(x => x.id === id ? { ...x, name } : x),
          }));
          pushToast({ msg: `Renamed template to "${name}"` });
        }
        setModal(null);
      },
    });
  };

  const deleteTemplate = (id) => {
    const t = (state.templates || []).find(x => x.id === id);
    if (!t) return;
    setModal({
      kind: 'confirm',
      title: 'Delete template',
      body: <>Delete template <b>{t.name}</b>?</>,
      confirmLabel: 'Delete',
      onConfirm: () => {
        pushHistory();
        setState(s => ({ ...s, templates: (s.templates || []).filter(x => x.id !== id) }));
        pushToast({ msg: `Deleted template: ${t.name}`, action: { label: 'Undo' } });
      },
    });
  };

  const promptRenameScenario = (sc) => {
    setModal({
      kind: 'prompt',
      title: 'Rename scenario',
      label: 'Scenario name',
      initialValue: sc.name,
      confirmLabel: 'Rename',
      onSubmit: (name) => { renameScenario(sc.id, name); setModal(null); },
    });
  };

  const promptDeleteScenario = (sc) => {
    setModal({
      kind: 'confirm',
      title: 'Delete scenario',
      body: <>Delete scenario <b>{sc.name}</b>? Use the Undo toast to recover immediately.</>,
      confirmLabel: 'Delete',
      onConfirm: () => deleteScenario(sc.id),
    });
  };

  const scenarios = state.scenarios.filter(s => s.practiceId === practiceId).sort((a, b) => b.created - a.created);
  const templates = state.templates || [];

  const leftPane = (
    <InputsPane
      practice={practice} result={result}
      retention={retention} setRet={setRet} setAllRet={setAllRet} resetRet={resetRet}
      masterRet={masterRet} updatePractice={updatePractice} updatePracticeAge={updatePracticeAge}
      scenarios={scenarios} selectedScenarioId={selectedScenarioId} setSelectedScenarioId={(id) => {
        setSelectedScenarioId(id);
        const sc = scenarios.find(s => s.id === id);
        if (sc) setRetention(sc.retention);
      }}
      promptRenameScenario={promptRenameScenario} promptDeleteScenario={promptDeleteScenario}
      templates={templates}
      applyTemplate={applyTemplate} saveCurrentAsTemplate={saveCurrentAsTemplate}
      renameTemplate={renameTemplate} deleteTemplate={deleteTemplate}
      state={state}
    />
  );

  const rightPane = (
    <ResultsPane
      practice={practice} result={result}
      retention={retention} streamRetained={streamRetained} streamOffer={streamOffer}
      totalRetained={totalRetained} totalOffer={totalOffer}
      variance={variance} baselineTotal={baselineTotal}
      expanded={expanded} setExpanded={setExpanded}
      density={density}
    />
  );

  // Layout variants
  const twoPane = (
    <div className="wb-two">
      <div className="wb-sticky" style={{ position: 'sticky', top: 80 }}>{leftPane}</div>
      <div>{rightPane}</div>
    </div>
  );

  const threeCol = (
    <div className="wb-three">
      <div className="wb-sticky" style={{ position: 'sticky', top: 80 }}>{leftPane}</div>
      <div>{rightPane}</div>
      <div className="wb-sticky" style={{ position: 'sticky', top: 80 }}>
        <BreakdownSidebar result={result} streamOffer={streamOffer} retention={retention}/>
      </div>
    </div>
  );

  const [activeTab, setActiveTab] = React.useState('inputs');
  const tabbed = (
    <div>
      <div className="seg" style={{ marginBottom: 16 }}>
        <button className={activeTab === 'inputs' ? 'on' : ''} onClick={() => setActiveTab('inputs')}>Inputs & pass-through</button>
        <button className={activeTab === 'results' ? 'on' : ''} onClick={() => setActiveTab('results')}>Results</button>
      </div>
      {activeTab === 'inputs' ? leftPane : rightPane}
    </div>
  );

  return (
    <div className="content">
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 20 }}>
        <Button variant="ghost" onClick={onBack} icon={<ICONS.ArrowBack/>}>Register</Button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 12 }}>
            {practice.name}
            <TypeChip type={practice.practiceType}/>
          </h1>
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            Scenario Workbench · {window.fmtNumber(result.totalPatients)} enrolled
            {selectedScenarioId && scenarios.find(s => s.id === selectedScenarioId) &&
              <> · viewing <b style={{ color: 'var(--text-strong)' }}>{scenarios.find(s => s.id === selectedScenarioId).name}</b></>}
          </div>
        </div>
        <Button onClick={() => setSaveOpen(true)} icon={<ICONS.Save/>}>Save as scenario</Button>
        <Button onClick={onCompare} icon={<ICONS.Compare/>}>Add to comparison</Button>
        <Button onClick={() => pushToast({msg: 'Exported scenario CSV'})} icon={<ICONS.Download/>}>Export</Button>
      </div>

      {layoutVariant === 'threeCol' ? threeCol :
       layoutVariant === 'tabbed' ? tabbed : twoPane}

      <Modal open={saveOpen} title="Save as scenario" onClose={() => setSaveOpen(false)}
        footer={<>
          <Button variant="ghost" onClick={() => setSaveOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={saveScenario} disabled={!scenarioName.trim()}>Save</Button>
        </>}>
        <div className="field">
          <label>Scenario name</label>
          <input autoFocus className="input"
            placeholder="e.g. 2026 base offer — 85% pass-through"
            value={scenarioName} onChange={e => setScenarioName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && saveScenario()}/>
          <div className="hint">
            Saves the current pass-through settings under this practice. You'll be able to compare it against other scenarios on the Comparison screen.
          </div>
        </div>
      </Modal>

      <PromptModal
        open={modal?.kind === 'prompt'}
        title={modal?.title} label={modal?.label}
        initialValue={modal?.initialValue || ''}
        placeholder={modal?.placeholder}
        confirmLabel={modal?.confirmLabel}
        onSubmit={(v) => modal?.onSubmit?.(v)}
        onClose={() => setModal(null)}
      />
      <ConfirmModal
        open={modal?.kind === 'confirm'}
        title={modal?.title} body={modal?.body}
        confirmLabel={modal?.confirmLabel}
        onConfirm={() => modal?.onConfirm?.()}
        onClose={() => setModal(null)}
      />
    </div>
  );
}

function InputsPane({ practice, result, retention, setRet, setAllRet, resetRet, masterRet, updatePractice, updatePracticeAge, scenarios, selectedScenarioId, setSelectedScenarioId, promptRenameScenario, promptDeleteScenario, templates, applyTemplate, saveCurrentAsTemplate, renameTemplate, deleteTemplate, state }) {
  const selected = scenarios.find(s => s.id === selectedScenarioId);
  const onRename = () => { if (selected) promptRenameScenario(selected); };
  const onDelete = () => { if (selected) promptDeleteScenario(selected); };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="card">
        <div className="card-head" style={{ padding: '12px 16px' }}>
          <h3>Scenario</h3>
        </div>
        <div className="card-body" style={{ padding: '14px 16px' }}>
          <div className="field">
            <label>Saved scenarios for this practice</label>
            <div style={{ display: 'flex', gap: 6, alignItems: 'stretch' }}>
              <select className="input" style={{ flex: 1 }} value={selectedScenarioId || ''} onChange={e => setSelectedScenarioId(e.target.value || null)}>
                <option value="">— ad-hoc (unsaved) —</option>
                {scenarios.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <button className="btn ghost icon sm" onClick={onRename} disabled={!selected} title="Rename scenario">
                <ICONS.Edit/>
              </button>
              <button className="btn ghost icon sm danger" onClick={onDelete} disabled={!selected} title="Delete scenario">
                <ICONS.Trash/>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head" style={{ padding: '12px 16px' }}>
          <h3>Pass-through templates</h3>
          <span className="sub" style={{ marginLeft: 'auto', marginRight: 10, color: 'var(--text-dim)' }}>Reusable across practices</span>
          <Button variant="ghost" size="sm" onClick={saveCurrentAsTemplate} icon={<ICONS.Plus/>}>Save current</Button>
        </div>
        <div className="card-body" style={{ padding: '10px 12px 12px' }}>
          {templates.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: '4px 6px' }}>
              No templates yet. Set the sliders below and hit "Save current".
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {templates.map(t => {
                const avg = Math.round((t.retention.firstLevel + t.retention.hop + t.retention.sia + t.retention.careplus) / 4);
                const flat = t.retention.firstLevel === t.retention.hop && t.retention.hop === t.retention.sia && t.retention.sia === t.retention.careplus;
                return (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', borderRadius: 'var(--r)', background: 'var(--surface-2)' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.name}
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-dim)' }}>
                        {flat ? `${100 - avg}% flat` : `FL ${100 - t.retention.firstLevel} · HOP ${100 - t.retention.hop} · SIA ${100 - t.retention.sia} · CP ${100 - t.retention.careplus}`}
                      </div>
                    </div>
                    <button className="btn sm" onClick={() => applyTemplate(t.id)} title="Apply to current practice">Apply</button>
                    <button className="btn ghost icon sm" onClick={() => renameTemplate(t.id)} title="Rename"><ICONS.Edit/></button>
                    <button className="btn ghost icon sm danger" onClick={() => deleteTemplate(t.id)} title="Delete"><ICONS.Trash/></button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-head" style={{ padding: '12px 16px' }}>
          <h3>Pass-through to practice</h3>
          <span className="sub" style={{ marginLeft: 'auto', marginRight: 10, color: 'var(--text-dim)' }}>PHO retains the remainder</span>
          <Button variant="ghost" size="sm" onClick={resetRet}>Reset</Button>
        </div>
        <div className="card-body" style={{ padding: '8px 16px 16px' }}>
          <SliderRow label="Apply to all" retention={masterRet} onChange={setAllRet} master/>
          <SliderRow label="First-Level" retention={retention.firstLevel} onChange={(v) => setRet('firstLevel', v)} color={STREAM_COLORS.firstLevel}/>
          <SliderRow label="HOP" retention={retention.hop} onChange={(v) => setRet('hop', v)} color={STREAM_COLORS.hop}/>
          <SliderRow label="SIA" retention={retention.sia} onChange={(v) => setRet('sia', v)} color={STREAM_COLORS.sia}/>
          <SliderRow label="CarePlus" retention={retention.careplus} onChange={(v) => setRet('careplus', v)} color={STREAM_COLORS.careplus}/>
        </div>
      </div>

      <AgeBandCard practice={practice} result={result} updatePracticeAge={updatePracticeAge}/>

      <MarginalsCard practice={practice} result={result} updatePractice={updatePractice}/>
    </div>
  );
}

function SliderRow({ label, retention, onChange, color, master }) {
  // UI works in pass-through space (100 - retention); onChange still emits retention.
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

function wheelStep(e, current, onChange, { min = 0, max = Infinity } = {}) {
  // Only step when input is focused — avoids accidental bumps when scrolling the page.
  if (document.activeElement !== e.currentTarget) return;
  e.preventDefault();
  const base = e.altKey ? 100 : e.shiftKey ? 10 : 1;
  const dir = e.deltaY < 0 ? 1 : -1;
  const next = Math.max(min, Math.min(max, (current || 0) + dir * base));
  onChange(next);
}

function AgeBandCard({ practice, result, updatePracticeAge }) {
  const total = result.totalPatients;
  const max = Math.max(1, ...window.AGE_BANDS.map(b => practice.ageCounts[b] || 0));
  return (
    <div className="card">
      <div className="card-head" style={{ padding: '12px 16px' }}>
        <h3>Age-band enrolment</h3>
        <span className="sub" style={{ marginLeft: 'auto', color: 'var(--text-dim)' }}>Patients by band · scroll to adjust</span>
      </div>
      <div className="card-body" style={{ padding: '14px 16px' }}>
        <div className="demog-grid cols-2">
          {window.AGE_BANDS.map(b => {
            const count = practice.ageCounts[b] || 0;
            const pct = total > 0 ? (count / total * 100) : 0;
            const barPct = (count / max) * 100;
            return (
              <div key={b} className={'demog-row' + (count === 0 ? ' empty' : '')}>
                <label className="lbl" htmlFor={`age-${b}`}>
                  {b}
                  <span className="sub">{b === '0-4' ? 'Under 5' : b === '65+' ? '65 and over' : 'Years'}</span>
                </label>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                  <input id={`age-${b}`} className="bare-input" type="number" min="0"
                    value={practice.ageCounts[b] || ''} placeholder="0"
                    onWheel={e => wheelStep(e, count, v => updatePracticeAge(b, v))}
                    onChange={e => updatePracticeAge(b, parseInt(e.target.value, 10))}/>
                  <span className="pct">{count > 0 ? pct.toFixed(0) + '%' : ''}</span>
                </div>
                <div className="bar" style={{ width: (count > 0 ? barPct : 0) + '%' }}/>
              </div>
            );
          })}
        </div>
        <div className="demog-footer">
          <span>Total enrolled <span style={{ color: 'var(--text-dim)' }}>(marginals reference this)</span></span>
          <span className="total-pill num">{window.fmtNumber(total)} <span className="delta">patients</span></span>
        </div>
      </div>
    </div>
  );
}

function MarginalsCard({ practice, result, updatePractice }) {
  const total = result.totalPatients;
  const expectedFemale = Math.round(total * 0.5);
  const female = practice.femaleCount ?? expectedFemale;
  const femaleMismatch = total > 0 && Math.abs(female - expectedFemale) > total * 0.15;

  const rows = [
    {
      key: 'female', label: 'Female', sub: 'of enrolled',
      value: practice.femaleCount, placeholder: String(expectedFemale),
      onChange: v => updatePractice({ femaleCount: v }),
      anomaly: femaleMismatch ? `Unusual ratio vs 50% baseline` : null,
    },
    {
      key: 'mp', label: 'Māori + Pacific', sub: 'of enrolled',
      value: practice.maoriPacificCount, placeholder: '0',
      onChange: v => updatePractice({ maoriPacificCount: v || 0 }),
    },
    {
      key: 'dep', label: 'Dep 9–10 (Q5)', sub: 'of enrolled',
      value: practice.dep9to10Count, placeholder: '0',
      onChange: v => updatePractice({ dep9to10Count: v || 0 }),
    },
    {
      key: 'csc', label: 'CSC holders', sub: 'of enrolled',
      value: practice.cscCount, placeholder: '0',
      onChange: v => updatePractice({ cscCount: v || 0 }),
    },
    {
      key: 'huhc', label: 'HUHC', sub: 'of enrolled',
      value: practice.huhcCount, placeholder: '—',
      onChange: v => updatePractice({ huhcCount: v }),
    },
  ];

  // overflow = more members in a subgroup than total enrolled (impossible)
  const overflows = rows.filter(r => r.value != null && r.value > total && total > 0);

  return (
    <div className="card">
      <div className="card-head" style={{ padding: '12px 16px' }}>
        <h3>Demographic marginals</h3>
        {overflows.length > 0 ? (
          <span className="chip" style={{ marginLeft: 'auto', background: 'color-mix(in oklab, var(--amber) 18%, var(--surface))', color: 'var(--amber-strong, #8a5a00)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <ICONS.Warn size={11}/> {overflows.length} exceed{overflows.length === 1 ? 's' : ''} enrolled
          </span>
        ) : (
          <span className="sub" style={{ marginLeft: 'auto', color: 'var(--text-dim)' }}>subsets of {window.fmtNumber(total)} · scroll to adjust</span>
        )}
      </div>
      <div className="card-body" style={{ padding: '14px 16px' }}>
        <div className="demog-grid cols-2">
          {rows.map(r => {
            const count = r.value ?? 0;
            const hasValue = r.value != null && r.value !== '';
            const pct = total > 0 && hasValue ? (count / total * 100) : null;
            const overflow = hasValue && count > total && total > 0;
            const showAnomaly = !overflow && r.anomaly && hasValue;
            return (
              <div key={r.key} className={'demog-row' + (!hasValue ? ' empty' : '') + (overflow || showAnomaly ? ' mismatch' : '')}>
                <label className="lbl" htmlFor={`marg-${r.key}`}>
                  {r.label}
                  <span className="sub">
                    {overflow
                      ? <span style={{ color: 'var(--amber-strong, #8a5a00)' }}>Exceeds total by {window.fmtNumber(count - total)}</span>
                      : showAnomaly ? <span style={{ color: 'var(--amber-strong, #8a5a00)' }}>{r.anomaly}</span>
                      : r.sub}
                  </span>
                </label>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                  <input id={`marg-${r.key}`} className="bare-input" type="number" min="0" max={total}
                    value={r.value ?? ''} placeholder={r.placeholder}
                    onWheel={e => wheelStep(e, count, r.onChange, { min: 0 })}
                    onChange={e => {
                      const raw = e.target.value;
                      if (raw === '') return r.onChange(null);
                      const n = parseInt(raw, 10);
                      if (isNaN(n)) return;
                      r.onChange(n); // allow overflow, flag visually; no silent clamp
                    }}/>
                  <span className="pct">{pct != null ? (pct > 999 ? '>999%' : pct.toFixed(0) + '%') : ''}</span>
                </div>
                <div className="bar" style={{ width: (pct != null ? Math.min(100, pct) : 0) + '%' }}/>
              </div>
            );
          })}
        </div>
        <div className="demog-footer">
          <span style={{ maxWidth: '70%', lineHeight: 1.35 }}>
            Each count is a <em style={{ color: 'var(--text-muted)', fontStyle: 'normal' }}>subset</em> of enrolled — one patient can be in several. Must not exceed total.
          </span>
        </div>
      </div>
    </div>
  );
}

function ResultsPane({ practice, result, retention, streamRetained, streamOffer, totalRetained, totalOffer, variance, baselineTotal, expanded, setExpanded, density }) {
  const summary = [
    { label: 'Annual PHO revenue', value: result.grandTotal, sub: `${window.fmtCurrency(result.grandTotal / 12, { compact: true })}/mo`, strong: true },
    { label: 'PHO retains', value: totalRetained, sub: ((totalRetained / result.grandTotal) * 100 || 0).toFixed(1) + '% weighted' },
    { label: 'Offer to practice', value: totalOffer, sub: `${window.fmtCurrency(totalOffer / 12, { compact: true })}/mo`, accent: true },
  ];
  if (baselineTotal != null) {
    summary.push({ label: 'Variance vs current', value: variance, variance: true, sub: `vs ${window.fmtCurrency(baselineTotal, { compact: true })} current` });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Top summary */}
      <div className="card">
        <div className="card-body" style={{ padding: 20, display: 'grid', gridTemplateColumns: `repeat(${summary.length}, 1fr)`, gap: 24 }}>
          {summary.map((s, i) => (
            <div key={i} style={{ borderLeft: i > 0 ? '1px solid var(--border)' : 'none', paddingLeft: i > 0 ? 24 : 0 }}>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 8 }}>{s.label}</div>
              <div style={{
                fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em',
                color: s.variance ? (s.value >= 0 ? 'var(--pos)' : 'var(--neg)') : s.accent ? 'var(--accent)' : 'var(--text-strong)',
              }} className="num">
                {s.variance ? window.fmtCurrencySigned(s.value, { compact: true }) : window.fmtCurrency(s.value)}
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--text-dim)', marginTop: 2 }}>{s.sub}</div>
            </div>
          ))}
        </div>
        {/* Stacked contribution bar across full card */}
        <div style={{ padding: '0 20px 18px' }}>
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 10 }}>
            Revenue composition
          </div>
          <StackedBar items={STREAM_KEYS.map(k => ({
            label: STREAM_LABELS[k], value: result.streams[k].total, color: STREAM_COLORS[k],
          }))} height={10} showLabels/>
        </div>
      </div>

      {/* Stream cards grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        {STREAM_KEYS.map(k => (
          <StreamCard key={k}
            streamKey={k} stream={result.streams[k]}
            retention={retention[k]} retained={streamRetained[k]} offer={streamOffer[k]}
            total={result.grandTotal}
            baseline={practice.baseline?.[k]}
            expanded={!!expanded[k]} onToggle={() => setExpanded(e => ({ ...e, [k]: !e[k] }))}
            density={density}
          />
        ))}
      </div>

      {/* Variance strip */}
      {practice.baseline && (
        <div className="card">
          <div className="card-head" style={{ padding: '12px 16px' }}>
            <h3>Variance vs current PHO offer</h3>
            <span className="sub" style={{ marginLeft: 'auto' }}>Per stream — offer to practice</span>
          </div>
          <div className="card-body" style={{ padding: '14px 16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              {STREAM_KEYS.map(k => {
                const base = practice.baseline?.[k] || 0;
                const delta = streamOffer[k] - base;
                const pos = delta >= 0;
                return (
                  <div key={k} style={{ paddingLeft: 12, borderLeft: `3px solid ${STREAM_COLORS[k]}` }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{STREAM_LABELS[k]}</div>
                    <div style={{
                      fontSize: 18, fontWeight: 700,
                      color: Math.abs(delta) < 100 ? 'var(--text-dim)' : (pos ? 'var(--pos)' : 'var(--neg)'),
                      letterSpacing: '-0.01em',
                    }} className="num">
                      {Math.abs(delta) < 100 ? '≈ 0' : window.fmtCurrencySigned(delta, { compact: true })}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }} className="num">
                      offer {window.fmtCurrency(streamOffer[k], { compact: true })} · current {window.fmtCurrency(base, { compact: true })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StreamCard({ streamKey, stream, retention, retained, offer, total, baseline, expanded, onToggle, density }) {
  const pct = stream.total > 0 ? (stream.total / total * 100) : 0;
  return (
    <div className="card stream-card" style={{ padding: density === 'tight' ? 14 : 18 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
        <div style={{ width: 4, alignSelf: 'stretch', background: STREAM_COLORS[streamKey], borderRadius: 2, flexShrink: 0 }}/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2, justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{stream.name}</h3>
            <span className="chip num" style={{ background: 'var(--surface-2)', color: 'var(--text-muted)', flexShrink: 0 }}>{pct.toFixed(0)}% of total</span>
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            Effective {stream.effective} · <span style={{ color: 'var(--text-muted)' }}>{stream.source}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, margin: '10px 0' }}>
        <div className="tt">
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>PHO revenue</div>
          <div style={{ fontSize: density === 'tight' ? 18 : 22, fontWeight: 700, color: 'var(--text-strong)', letterSpacing: '-0.01em' }} className="num stream-num">
            {window.fmtCurrency(stream.total, { compact: true })}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)' }} className="num">{window.fmtCurrency(stream.total / 12, { compact: true })}/mo</div>
          <div className="tt-body wide">
            Full: {window.fmtCurrency(stream.total)} · {stream.notes}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Offer to practice · {100 - retention}% pass</div>
          <div style={{ fontSize: density === 'tight' ? 18 : 22, fontWeight: 700, color: 'var(--accent)', letterSpacing: '-0.01em' }} className="num stream-num">
            {window.fmtCurrency(offer, { compact: true })}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)' }} className="num">
            PHO retains {window.fmtCurrency(retained, { compact: true })}
            {baseline != null && <> · vs <Money value={baseline} compact/> current</>}
          </div>
        </div>
      </div>

      <Sparkline value={stream.total} max={total} color={STREAM_COLORS[streamKey]}/>

      <button onClick={onToggle} className="btn ghost sm" style={{ marginTop: 10, padding: '4px 6px' }}>
        {expanded ? <ICONS.ChevronDown size={13}/> : <ICONS.Chevron size={13}/>}
        {expanded ? 'Hide' : 'Show'} breakdown
      </button>

      {expanded && (
        <div style={{ marginTop: 10, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
          <table className="table" style={{ fontSize: 12 }}>
            <thead>
              <tr><th style={{ padding: '6px 0', background: 'transparent' }}>Cell</th><th className="num" style={{ padding: '6px 0', background: 'transparent' }}>Count</th><th className="num" style={{ padding: '6px 0', background: 'transparent' }}>Rate</th><th className="num" style={{ padding: '6px 0', background: 'transparent' }}>Amount</th></tr>
            </thead>
            <tbody>
              {stream.cells.slice(0, 10).map((c, i) => (
                <tr key={i}>
                  <td style={{ padding: '6px 0', color: 'var(--text-muted)', border: 'none' }}>{c.label}</td>
                  <td className="num" style={{ padding: '6px 0', border: 'none' }}>{window.fmtNumber(c.count, 0)}</td>
                  <td className="num" style={{ padding: '6px 0', color: 'var(--text-muted)', border: 'none' }}>{window.fmtCurrency(c.rate, { decimals: 2 })}</td>
                  <td className="num" style={{ padding: '6px 0', fontWeight: 500, border: 'none' }}>{window.fmtCurrency(c.amount, { compact: true })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function BreakdownSidebar({ result, streamOffer, retention }) {
  return (
    <div className="card">
      <div className="card-head" style={{ padding: '12px 16px' }}><h3>Summary</h3></div>
      <div className="card-body" style={{ padding: '14px 16px' }}>
        <table className="table" style={{ fontSize: 13 }}>
          <tbody>
            {STREAM_KEYS.map(k => (
              <tr key={k}>
                <td style={{ padding: '8px 0', border: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: STREAM_COLORS[k] }}/>
                  <span style={{ color: 'var(--text-muted)' }}>{STREAM_LABELS[k]}</span>
                </td>
                <td className="num" style={{ padding: '8px 0', border: 'none', textAlign: 'right', fontWeight: 500 }}>
                  {window.fmtCurrency(streamOffer[k], { compact: true })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

window.Workbench = Workbench;
