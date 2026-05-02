// register.jsx — Screen 1: Practice Register

const { Button, TypeChip, VarianceChip, Money, ICONS } = window;

function PracticeRegister({ state, setState, onOpenPractice, onEditPractice, onAddPractice, onImport, onSetActive, onCompare, pushToast, pushHistory, firstRun }) {
  const [confirmDelete, setConfirmDelete] = React.useState(null);
  const [menuOpen, setMenuOpen] = React.useState(null);

  // Compute stats per practice using default scenario (10% flat) so the register has numbers
  const rows = React.useMemo(() => state.practices.map(p => {
    const r = window.ffCompute(p);
    const defaultRetention = 0.10;
    const offer = r.grandTotal * (1 - defaultRetention);
    let variance = null;
    if (p.baseline) {
      const base = window.STREAM_KEYS.reduce((s, k) => s + (p.baseline[k] || 0), 0);
      variance = offer - base;
    }
    return { practice: p, total: r.grandTotal, offer, variance, patients: r.totalPatients };
  }), [state.practices]);

  const duplicate = (p) => {
    pushHistory();
    const copy = {
      ...JSON.parse(JSON.stringify(p)),
      id: 'p-' + Math.random().toString(36).slice(2, 9),
      name: p.name + ' (copy)',
      created: Date.now(),
      modified: Date.now(),
    };
    setState(s => ({ ...s, practices: [...s.practices, copy] }));
    pushToast({ msg: 'Duplicated ' + p.name });
    setMenuOpen(null);
  };

  const del = (p) => {
    pushHistory();
    setState(s => ({
      ...s,
      practices: s.practices.filter(x => x.id !== p.id),
      scenarios: s.scenarios.filter(sc => sc.practiceId !== p.id),
    }));
    pushToast({ msg: 'Deleted ' + p.name, action: { label: 'Undo' } });
    setConfirmDelete(null);
    setMenuOpen(null);
  };

  // Empty state
  if (state.practices.length === 0 || firstRun) {
    return <EmptyState onAddPractice={onAddPractice} onImport={onImport} onSeed={() => {
      pushHistory();
      setState(s => ({ ...s, practices: window.SEED_PRACTICES.slice(), scenarios: window.SEED_SCENARIOS.slice(), firstRun: false }));
      pushToast({ msg: 'Loaded 3 example practices' });
    }} onDismissOnboarding={() => setState(s => ({ ...s, firstRun: false }))}/>;
  }

  return (
    <div className="content">
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 24 }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 4 }}>Practice Register</h1>
          <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            {state.practices.length} practices · {state.scenarios.length} saved scenarios · all data stored locally
          </div>
        </div>
        <Button onClick={onImport} icon={<ICONS.Import/>}>Import CSV</Button>
        <Button onClick={onCompare} icon={<ICONS.Compare/>}>Compare</Button>
        <Button variant="primary" onClick={onAddPractice} icon={<ICONS.Plus/>}>Add practice</Button>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: '28%' }}>Practice</th>
              <th>Type</th>
              <th className="num">Patients</th>
              <th className="num">PHO revenue / yr</th>
              <th className="num">Offer to practice</th>
              <th className="num">Variance vs current</th>
              <th>Last modified</th>
              <th style={{ width: 140 }}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ practice, total, offer, variance, patients }) => (
              <tr key={practice.id} className="row-click" onClick={() => onOpenPractice(practice.id)}>
                <td>
                  <div style={{ fontWeight: 600, color: 'var(--text-strong)' }}>{practice.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>
                    {state.scenarios.filter(s => s.practiceId === practice.id).length} scenarios
                  </div>
                </td>
                <td><TypeChip type={practice.practiceType}/></td>
                <td className="num">{window.fmtNumber(patients)}</td>
                <td className="num"><Money value={total}/></td>
                <td className="num" style={{ color: 'var(--text-strong)', fontWeight: 500 }}>
                  <Money value={offer}/>
                  <span style={{ color: 'var(--text-dim)', fontWeight: 400, fontSize: 12, marginLeft: 4 }}>@ 90% pass</span>
                </td>
                <td className="num">
                  {variance != null ? <VarianceChip value={variance}/> : <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>no baseline</span>}
                </td>
                <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{window.fmtDate(practice.modified)}</td>
                <td onClick={e => e.stopPropagation()}>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', position: 'relative' }}>
                    <Button size="sm" onClick={() => onEditPractice(practice.id)} icon={<ICONS.Edit/>}>Edit</Button>
                    <button className="btn ghost icon sm" title="More actions" onClick={() => setMenuOpen(menuOpen === practice.id ? null : practice.id)}>
                      <ICONS.More/>
                    </button>
                    {menuOpen === practice.id && (
                      <div style={{
                        position: 'absolute', right: 0, top: '100%', marginTop: 4,
                        background: 'var(--surface)', border: '1px solid var(--border)',
                        borderRadius: 'var(--r)', boxShadow: 'var(--shadow-lg)',
                        minWidth: 180, zIndex: 20, padding: 4,
                      }}>
                        <MenuItem icon={<ICONS.Copy/>} onClick={() => duplicate(practice)}>Duplicate</MenuItem>
                        <MenuItem icon={<ICONS.Download/>} onClick={() => { pushToast({msg: 'CSV exported'}); setMenuOpen(null); }}>Export CSV</MenuItem>
                        <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }}/>
                        <MenuItem icon={<ICONS.Trash/>} danger onClick={() => { setConfirmDelete(practice); setMenuOpen(null); }}>Delete</MenuItem>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-dim)', fontSize: 12 }}>
        <ICONS.Info size={13}/>
        Offer column assumes 90% flat pass-through — open a practice to set per-stream pass-through and save named scenarios.
      </div>

      <Modal open={!!confirmDelete} title="Delete practice?" onClose={() => setConfirmDelete(null)}
        footer={<>
          <Button variant="ghost" onClick={() => setConfirmDelete(null)}>Cancel</Button>
          <Button variant="primary" onClick={() => del(confirmDelete)} icon={<ICONS.Trash/>}>Delete</Button>
        </>}>
        <p style={{ margin: 0 }}>
          This will delete <b>{confirmDelete?.name}</b> and all of its saved scenarios.
          This cannot be undone from a later session, but you can <kbd style={kbdStyle}>⌘Z</kbd> during this session.
        </p>
      </Modal>
    </div>
  );
}

const kbdStyle = {
  background: 'var(--surface-2)', border: '1px solid var(--border)',
  padding: '1px 5px', borderRadius: 4, fontSize: 11, fontFamily: 'inherit',
  color: 'var(--text-muted)',
};

function MenuItem({ children, icon, onClick, danger }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '7px 10px', border: 'none', background: 'transparent',
      width: '100%', textAlign: 'left',
      fontSize: 13.5, color: danger ? 'var(--accent)' : 'var(--text-strong)',
      borderRadius: 'var(--r-sm)', cursor: 'pointer',
    }}
    onMouseEnter={e => e.currentTarget.style.background = danger ? 'var(--pink-soft)' : 'var(--surface-hover)'}
    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <span style={{ width: 15, height: 15, display: 'inline-flex' }}>{icon && React.cloneElement(icon, { size: 15 })}</span>
      {children}
    </button>
  );
}

function EmptyState({ onAddPractice, onImport, onSeed, onDismissOnboarding }) {
  return (
    <div className="content narrow">
      <div style={{ padding: '40px 0 8px', display: 'grid', gridTemplateColumns: '1fr 340px', gap: 48, alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 14, color: 'var(--accent)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 12 }}>
            Tēnā koe — welcome to FFCalc
          </div>
          <h1 style={{ fontSize: 34, fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: 16 }}>
            Model bulk-funding offers for<br/>thePHO practices.
          </h1>
          <p style={{ fontSize: 15.5, color: 'var(--text-muted)', maxWidth: 560, marginBottom: 28, lineHeight: 1.55 }}>
            FFCalc takes a practice's enrolled-patient demographics and returns the Te Whatu Ora
            capitation revenue it generates, split across First-Level, HOP, SIA, and CarePlus.
            You set the pass-through — the tool shows the offer, live.
          </p>
          <div style={{ display: 'flex', gap: 10, marginBottom: 32 }}>
            <Button variant="primary" onClick={onAddPractice} icon={<ICONS.Plus/>}>Add your first practice</Button>
            <Button onClick={onSeed} icon={<ICONS.Users/>}>Load 3 example practices</Button>
            <Button variant="ghost" onClick={onImport} icon={<ICONS.Import/>}>Import from Karo CSV</Button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, maxWidth: 620 }}>
            <Feature icon={<ICONS.Drop/>} title="Offline, local only" body="All data stays in your browser. Nothing leaves this machine."/>
            <Feature icon={<ICONS.Sliders/>} title="Live recalculation" body="No Calculate button. Change an input, see the offer."/>
            <Feature icon={<ICONS.Book/>} title="Provenance on every $" body="Hover any figure to see its rate-table source and effective date."/>
          </div>
        </div>

        {/* thePHO brand panel */}
        <div style={{ position: 'relative' }}>
          <div style={{
            aspectRatio: '3/4', borderRadius: 'var(--r-lg)', overflow: 'hidden',
            background: 'linear-gradient(135deg, #ed696e 0%, #c23d41 100%)',
            boxShadow: 'var(--shadow-lg)',
            display: 'grid', placeItems: 'center',
            padding: 32,
          }}>
            <img src={window.LOGO_REVERSED_URL} alt="thePHO" style={{ width: '90%', height: 'auto', display: 'block' }}/>
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-dim)', textAlign: 'center', fontStyle: 'italic' }}>
            The New Zealand Primary Health Organisation
          </div>
        </div>
      </div>

      <button onClick={onDismissOnboarding} className="btn ghost" style={{ marginTop: 24 }}>
        Skip onboarding →
      </button>
    </div>
  );
}

function Feature({ icon, title, body }) {
  return (
    <div>
      <div style={{
        width: 32, height: 32, borderRadius: 8, background: 'var(--pink-soft)', color: 'var(--accent)',
        display: 'grid', placeItems: 'center', marginBottom: 10,
      }}>{React.cloneElement(icon, { size: 17 })}</div>
      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-strong)', marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{body}</div>
    </div>
  );
}

window.PracticeRegister = PracticeRegister;
