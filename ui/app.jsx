// app.jsx — main app router + shell

const { ICONS, Button } = window;

function App() {
  const [state, setState] = React.useState(() => window.makeInitialState());
  const [route, setRoute] = React.useState(() => {
    try {
      const saved = localStorage.getItem('ffcalc:v1:route');
      if (saved) return JSON.parse(saved);
    } catch {}
    return { name: 'register' };
  });
  const [savingState, setSavingState] = React.useState('idle'); // idle, saving, saved
  const [tweaksOpen, setTweaksOpen] = React.useState(false);
  const [tweaks, setTweaks] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem('ffcalc:v1:tweaks')) || { theme: 'light', layout: 'twoPane', density: 'default' }; }
    catch { return { theme: 'light', layout: 'twoPane', density: 'default' }; }
  });

  const { toasts, push: pushToast } = window.useToasts();

  // Undo/redo
  const history = window.useHistory(state, setState);

  // Autosave
  React.useEffect(() => {
    setSavingState('saving');
    const t = setTimeout(() => {
      window.saveState(state);
      setSavingState('saved');
    }, 300);
    return () => clearTimeout(t);
  }, [state]);

  React.useEffect(() => {
    try { localStorage.setItem('ffcalc:v1:route', JSON.stringify(route)); } catch {}
  }, [route]);
  React.useEffect(() => {
    try { localStorage.setItem('ffcalc:v1:tweaks', JSON.stringify(tweaks)); } catch {}
    document.documentElement.dataset.theme = tweaks.theme;
    document.documentElement.dataset.density = tweaks.density;
  }, [tweaks]);

  // Keyboard shortcuts
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.target?.tagName === 'INPUT' || e.target?.tagName === 'TEXTAREA' || e.target?.tagName === 'SELECT') return;
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (history.undo()) pushToast({ msg: 'Undone' });
      } else if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault();
        if (history.redo()) pushToast({ msg: 'Redone' });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [history, pushToast]);

  // Tweaks mode host integration
  React.useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === '__activate_edit_mode') setTweaksOpen(true);
      else if (e.data?.type === '__deactivate_edit_mode') setTweaksOpen(false);
    };
    window.addEventListener('message', handler);
    try { window.parent.postMessage({ type: '__edit_mode_available' }, '*'); } catch {}
    return () => window.removeEventListener('message', handler);
  }, []);

  const go = (r) => setRoute(r);

  // Shared props
  const common = {
    state, setState,
    pushToast, pushHistory: history.push,
  };

  let screen;
  const routeName = route.name;
  if (routeName === 'register') {
    screen = <window.PracticeRegister {...common}
      firstRun={state.firstRun}
      onAddPractice={() => go({ name: 'editor', practiceId: null, isNew: true })}
      onOpenPractice={id => go({ name: 'workbench', practiceId: id })}
      onEditPractice={id => go({ name: 'editor', practiceId: id })}
      onImport={() => go({ name: 'data' })}
      onCompare={() => go({ name: 'compare' })}
    />;
  } else if (routeName === 'editor') {
    screen = <window.PracticeEditor {...common}
      practiceId={route.practiceId}
      isNew={!!route.isNew}
      onBack={() => go({ name: 'register' })}
      onSave={() => go({ name: 'register' })}
      onOpenWorkbench={(id) => go({ name: 'workbench', practiceId: id })}
    />;
  } else if (routeName === 'workbench') {
    screen = <window.Workbench {...common}
      practiceId={route.practiceId}
      layoutVariant={tweaks.layout}
      density={tweaks.density}
      onBack={() => go({ name: 'register' })}
      onCompare={() => go({ name: 'compare' })}
    />;
  } else if (routeName === 'compare') {
    screen = <window.Comparison {...common}
      onBack={() => go({ name: 'register' })}
      onOpenWorkbench={id => go({ name: 'workbench', practiceId: id })}
    />;
  } else if (routeName === 'rates') {
    screen = <window.Rates pushToast={pushToast} onBack={() => go({ name: 'register' })}/>;
  } else if (routeName === 'data') {
    screen = <window.DataScreen {...common} onBack={() => go({ name: 'register' })}/>;
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 6, paddingBottom: 16 }}>
          <img src={window.LOGO_URL} alt="thePHO" style={{ width: 168, height: 'auto', display: 'block' }}/>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600, paddingLeft: 2 }}>
            FFCalc · Bulk funding
          </div>
        </div>

        <NavItem icon={<ICONS.Home/>} active={routeName === 'register'} onClick={() => go({ name: 'register' })}>
          Practice Register<span className="badge">{state.practices.length}</span>
        </NavItem>
        <NavItem icon={<ICONS.Scale/>} active={routeName === 'workbench'} onClick={() => {
          const id = route.practiceId || state.practices[0]?.id;
          if (id) go({ name: 'workbench', practiceId: id });
          else pushToast({ msg: 'Add a practice first' });
        }}>Scenario Workbench</NavItem>
        <NavItem icon={<ICONS.Compare/>} active={routeName === 'compare'} onClick={() => go({ name: 'compare' })}>
          Comparison<span className="badge">{state.compareIds.length}</span>
        </NavItem>

        <div className="nav-section">Reference</div>
        <NavItem icon={<ICONS.Book/>} active={routeName === 'rates'} onClick={() => go({ name: 'rates' })}>Rate Reference</NavItem>
        <NavItem icon={<ICONS.Import/>} active={routeName === 'data'} onClick={() => go({ name: 'data' })}>Import / Export</NavItem>

        <div style={{ flex: 1 }}/>

        <div style={{ padding: '10px 8px', borderTop: '1px solid var(--border)', marginTop: 8 }}>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <ICONS.Drop size={12}/> Local-only · IndexedDB
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>v0.4.2 · Rates eff. 1 Jul 2025</div>
        </div>
      </aside>

      <main className="main">
        <div className="topbar">
          <button className="btn ghost sm" onClick={history.undo} title="Undo (⌘Z)" disabled={!history.canUndo()}>
            <ICONS.Undo size={14}/>
          </button>
          <button className="btn ghost sm" onClick={history.redo} title="Redo (⌘⇧Z)" disabled={!history.canRedo()}>
            <ICONS.Redo size={14}/>
          </button>
          <div className="spacer"/>
          <span className={'save-pill ' + (savingState === 'saving' ? 'saving' : '')}>
            <span className="dot"/>
            {savingState === 'saving' ? 'Saving…' : 'All changes saved'}
          </span>
        </div>

        {screen}
      </main>

      {/* Toasts */}
      <div className="toast-stack">
        {toasts.map(t => (
          <div key={t.id} className="toast">
            <span>{t.msg}</span>
            {t.action && <button className="undo" onClick={() => history.undo()}>Undo</button>}
          </div>
        ))}
      </div>

      {/* Tweaks panel */}
      {tweaksOpen && <TweaksPanel tweaks={tweaks} setTweaks={setTweaks} setState={setState} pushToast={pushToast}/>}
    </div>
  );
}

function NavItem({ icon, active, onClick, children }) {
  return (
    <button className={'nav-item' + (active ? ' active' : '')} onClick={onClick}>
      {icon} <span style={{ flex: 1 }}>{children}</span>
    </button>
  );
}

function TweaksPanel({ tweaks, setTweaks, setState, pushToast }) {
  const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
    "theme": "light",
    "layout": "twoPane",
    "density": "default"
  }/*EDITMODE-END*/;

  const update = (patch) => {
    setTweaks(t => ({ ...t, ...patch }));
    try { window.parent.postMessage({ type: '__edit_mode_set_keys', edits: patch }, '*'); } catch {}
  };

  return (
    <div className="tweaks-panel" style={{
      position: 'fixed', bottom: 20, right: 20, width: 300,
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-lg)',
      zIndex: 90, padding: 14,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <ICONS.Sliders size={15}/>
        <h3 style={{ fontSize: 13.5, fontWeight: 600, flex: 1 }}>Tweaks</h3>
      </div>

      <TweakGroup label="Theme">
        <div className="seg" style={{ width: '100%' }}>
          <button className={tweaks.theme === 'light' ? 'on' : ''} style={{ flex: 1 }} onClick={() => update({ theme: 'light' })}>
            <ICONS.Sun size={12}/> Light
          </button>
          <button className={tweaks.theme === 'dark' ? 'on' : ''} style={{ flex: 1 }} onClick={() => update({ theme: 'dark' })}>
            <ICONS.Moon size={12}/> Dark
          </button>
        </div>
      </TweakGroup>

      <TweakGroup label="Workbench layout">
        <div className="seg" style={{ width: '100%', flexDirection: 'column' }}>
          <button className={tweaks.layout === 'twoPane' ? 'on' : ''} onClick={() => update({ layout: 'twoPane' })}>
            60/40 split (default)
          </button>
          <button className={tweaks.layout === 'threeCol' ? 'on' : ''} onClick={() => update({ layout: 'threeCol' })}>
            Three columns
          </button>
          <button className={tweaks.layout === 'tabbed' ? 'on' : ''} onClick={() => update({ layout: 'tabbed' })}>
            Tabbed (narrow)
          </button>
        </div>
      </TweakGroup>

      <TweakGroup label="Results density">
        <div className="seg" style={{ width: '100%' }}>
          <button className={tweaks.density === 'default' ? 'on' : ''} style={{ flex: 1 }} onClick={() => update({ density: 'default' })}>
            Spacious
          </button>
          <button className={tweaks.density === 'tight' ? 'on' : ''} style={{ flex: 1 }} onClick={() => update({ density: 'tight' })}>
            Tight
          </button>
        </div>
      </TweakGroup>

      <button
        onClick={() => {
          if (confirm('Reset all practices and scenarios? This cannot be undone.')) {
            localStorage.removeItem(window.FFStorageKey);
            location.reload();
          }
        }}
        className="btn ghost sm" style={{ width: '100%', marginTop: 8, color: 'var(--text-muted)' }}>
        Reset all data
      </button>
    </div>
  );
}

function TweakGroup({ label, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 6 }}>
        {label}
      </div>
      {children}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
