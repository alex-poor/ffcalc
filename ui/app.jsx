// app.jsx — main app router + shell

const { ICONS, Button } = window;

// Tiny safe markdown renderer for release notes.
// Handles: # / ## / ### headings, - / * bullets, **bold**, *italic*, `code`, paragraphs.
// No raw HTML; React escapes all text — XSS-safe.
function renderInline(text, keyPrefix = '') {
  const parts = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*\s][^*]*\*)/g;
  let last = 0, m, k = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const t = m[0];
    if (t.startsWith('**')) parts.push(<b key={keyPrefix + (k++)}>{t.slice(2, -2)}</b>);
    else if (t.startsWith('`')) parts.push(<code key={keyPrefix + (k++)} style={{ background: 'var(--surface-2)', padding: '1px 4px', borderRadius: 3, fontSize: '0.92em' }}>{t.slice(1, -1)}</code>);
    else parts.push(<em key={keyPrefix + (k++)}>{t.slice(1, -1)}</em>);
    last = m.index + t.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function renderMarkdown(body) {
  if (!body) return null;
  const lines = body.split(/\r?\n/);
  const out = [];
  let list = null;
  let key = 0;
  const flush = () => { if (list) { out.push(<ul key={'u' + (key++)} style={{ margin: '4px 0 10px', paddingLeft: 22 }}>{list}</ul>); list = null; } };
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) { flush(); continue; }
    let m;
    if ((m = line.match(/^### (.+)/))) { flush(); out.push(<div key={'h3-' + (key++)} style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-strong)', margin: '10px 0 4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{renderInline(m[1], 'h3-' + key + '-')}</div>); continue; }
    if ((m = line.match(/^## (.+)/))) { flush(); out.push(<div key={'h2-' + (key++)} style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-strong)', margin: '14px 0 6px' }}>{renderInline(m[1], 'h2-' + key + '-')}</div>); continue; }
    if ((m = line.match(/^# (.+)/))) { flush(); out.push(<div key={'h1-' + (key++)} style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-strong)', margin: '14px 0 8px' }}>{renderInline(m[1], 'h1-' + key + '-')}</div>); continue; }
    if ((m = line.match(/^[-*] (.+)/))) {
      if (!list) list = [];
      list.push(<li key={'li-' + list.length} style={{ marginBottom: 3, lineHeight: 1.45 }}>{renderInline(m[1], 'li-' + list.length + '-')}</li>);
      continue;
    }
    flush();
    out.push(<p key={'p-' + (key++)} style={{ margin: '4px 0 8px', lineHeight: 1.5 }}>{renderInline(line, 'p-' + key + '-')}</p>);
  }
  flush();
  return out;
}

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
    const defaults = { theme: 'light', layout: 'twoPane', density: 'default', flsTopSlice: false };
    try { return { ...defaults, ...(JSON.parse(localStorage.getItem('ffcalc:v1:tweaks')) || {}) }; }
    catch { return defaults; }
  });

  const { toasts, push: pushToast } = window.useToasts();

  // Update checker
  const [updateInfo, setUpdateInfo] = React.useState(null);    // persistent "there's an update"
  const [updateModalOpen, setUpdateModalOpen] = React.useState(false);
  const [updateStatus, setUpdateStatus] = React.useState('idle'); // idle, checking, downloading, error
  const [updateProgress, setUpdateProgress] = React.useState(0);
  const [updateMsg, setUpdateMsg] = React.useState('');

  const runUpdateCheck = React.useCallback(async (silent) => {
    if (!window.ffUpdate) return;
    setUpdateStatus('checking');
    const res = await window.ffUpdate.checkForUpdate();
    setUpdateStatus('idle');
    if (res.available) {
      setUpdateInfo(res);
      setUpdateModalOpen(true);
    } else if (!silent) {
      if (res.reason === 'browser') pushToast({ msg: 'Updates only check in the desktop app' });
      else if (res.error) pushToast({ msg: `Update check failed: ${res.error}` });
      else pushToast({ msg: 'You\u2019re on the latest version' });
    }
  }, [pushToast]);

  // Silent check on launch, then every 30 minutes. Desktop only.
  React.useEffect(() => {
    if (!window.ffUpdate?.inTauri) return;
    const initial = setTimeout(() => runUpdateCheck(true), 1500);
    const interval = setInterval(() => runUpdateCheck(true), 30 * 60 * 1000);
    return () => { clearTimeout(initial); clearInterval(interval); };
  }, [runUpdateCheck]);

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
      flsTopSlice={tweaks.flsTopSlice}
      onBack={() => go({ name: 'register' })}
      onCompare={() => go({ name: 'compare' })}
      onEditPractice={(id) => go({ name: 'editor', practiceId: id })}
    />;
  } else if (routeName === 'compare') {
    screen = <window.Comparison {...common}
      flsTopSlice={tweaks.flsTopSlice}
      onBack={() => go({ name: 'register' })}
      onOpenWorkbench={id => go({ name: 'workbench', practiceId: id })}
    />;
  } else if (routeName === 'network') {
    screen = <window.Network {...common}
      flsTopSlice={tweaks.flsTopSlice}
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

        <NavItem icon={<ICONS.Home/>} active={routeName === 'register'} onClick={() => go({ name: 'register' })} count={state.practices.length}>
          Practice Register
        </NavItem>
        <NavItem icon={<ICONS.Scale/>} active={routeName === 'workbench'} onClick={() => {
          const id = route.practiceId || state.practices[0]?.id;
          if (id) go({ name: 'workbench', practiceId: id });
          else pushToast({ msg: 'Add a practice first' });
        }}>Scenario Workbench</NavItem>
        <NavItem icon={<ICONS.Compare/>} active={routeName === 'compare'} onClick={() => go({ name: 'compare' })} count={state.compareIds.length}>
          Comparison
        </NavItem>
        <NavItem icon={<ICONS.Users/>} active={routeName === 'network'} onClick={() => go({ name: 'network' })}>
          Network
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
          {updateInfo ? (
            <button
              onClick={() => setUpdateModalOpen(true)}
              className="update-pill"
              title="Update available"
            >
              <span className="dot"/>
              Update to v{updateInfo.version}
            </button>
          ) : updateStatus === 'checking' ? (
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>Checking for updates…</div>
          ) : window.ffUpdate?.inTauri ? (
            <button onClick={() => runUpdateCheck(false)} className="btn ghost sm" style={{ marginTop: 6, width: '100%', fontSize: 11.5, padding: '4px 8px' }}>
              Check for updates
            </button>
          ) : null}
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
          <button className="btn ghost sm icon" onClick={() => setTweaksOpen(v => !v)} title="Settings">
            <ICONS.Settings size={15}/>
          </button>
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
      {tweaksOpen && <TweaksPanel tweaks={tweaks} setTweaks={setTweaks} setState={setState} pushToast={pushToast}
        onCheckUpdate={() => runUpdateCheck(false)} updateStatus={updateStatus}/>}

      {/* Update-available modal */}
      {updateInfo && updateModalOpen && (
        <div className="modal-back" onClick={() => updateStatus !== 'downloading' && setUpdateModalOpen(false)}>
          <div className="modal fade-in" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Update available — v{updateInfo.version}</h3>
            </div>
            <div className="modal-body">
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>
                {`You're on v${updateInfo.currentVersion}. This will download, install, and relaunch the app.`}
              </div>
              {updateInfo.body && (
                <div style={{
                  fontSize: 12.5, color: 'var(--text)', background: 'var(--surface-2)',
                  padding: '12px 14px', borderRadius: 'var(--r)', maxHeight: 280, overflow: 'auto',
                  margin: 0,
                }}>{renderMarkdown(updateInfo.body)}</div>
              )}
              {updateStatus === 'downloading' && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>{updateMsg || 'Downloading\u2026'}</div>
                  <div style={{ height: 6, background: 'var(--stone)', borderRadius: 100, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: updateProgress + '%', background: 'var(--accent)', transition: 'width 0.2s' }}/>
                  </div>
                </div>
              )}
              {updateStatus === 'error' && (
                <div style={{ marginTop: 12, fontSize: 12.5, color: 'var(--accent)' }}>{updateMsg}</div>
              )}
            </div>
            <div className="modal-foot">
              <button className="btn ghost" disabled={updateStatus === 'downloading'} onClick={() => setUpdateModalOpen(false)}>Later</button>
              <button className="btn primary" disabled={updateStatus === 'downloading'} onClick={async () => {
                setUpdateStatus('downloading'); setUpdateProgress(0); setUpdateMsg('Starting\u2026');
                try {
                  await window.ffUpdate.downloadAndInstall(updateInfo, ({ phase, downloaded, total }) => {
                    if (phase === 'Started') setUpdateMsg('Downloading\u2026');
                    else if (phase === 'Progress' && total) setUpdateProgress(Math.min(100, Math.round((downloaded / total) * 100)));
                    else if (phase === 'Finished') setUpdateMsg('Installing\u2026');
                  });
                } catch (err) {
                  setUpdateStatus('error');
                  setUpdateMsg(String(err?.message || err));
                }
              }}>Install and restart</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NavItem({ icon, active, onClick, count, children }) {
  return (
    <button className={'nav-item' + (active ? ' active' : '')} onClick={onClick}>
      {icon} <span style={{ flex: 1 }}>{children}</span>
      {count != null && <span className="badge">{count}</span>}
    </button>
  );
}

function TweaksPanel({ tweaks, setTweaks, setState, pushToast, onCheckUpdate, updateStatus }) {
  const [confirmReset, setConfirmReset] = React.useState(false);
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

      <TweakGroup label="Advanced">
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5, color: 'var(--text)', cursor: 'pointer', lineHeight: 1.4 }}>
          <input type="checkbox" checked={!!tweaks.flsTopSlice} onChange={e => update({ flsTopSlice: e.target.checked })} style={{ marginTop: 2 }}/>
          <span>
            Allow First-Level top-slice
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
              Off: First-Level capitation always passes 100% to practices (default).
              On: shows a retention slider for First-Level alongside the others.
            </div>
          </span>
        </label>
      </TweakGroup>

      <button
        onClick={onCheckUpdate}
        disabled={updateStatus === 'checking' || !window.ffUpdate?.inTauri}
        title={!window.ffUpdate?.inTauri ? 'Only available in the desktop app' : ''}
        className="btn sm" style={{ width: '100%', marginTop: 8 }}>
        {updateStatus === 'checking' ? 'Checking\u2026' : 'Check for updates'}
      </button>

      <button
        onClick={() => setConfirmReset(true)}
        className="btn ghost sm" style={{ width: '100%', marginTop: 8, color: 'var(--text-muted)' }}>
        Reset all data
      </button>

      <window.ConfirmModal
        open={confirmReset}
        title="Reset all data"
        body="This deletes every practice, scenario, and template, and reloads the app. It cannot be undone."
        confirmLabel="Reset"
        onConfirm={() => {
          localStorage.removeItem(window.FFStorageKey);
          location.reload();
        }}
        onClose={() => setConfirmReset(false)}
      />
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
