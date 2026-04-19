// state.jsx — app-wide state: practices, scenarios, undo/redo, autosave
// Everything localStorage; no network.

const FFStorageKey = 'ffcalc:v1';

function loadState() {
  try {
    const raw = localStorage.getItem(FFStorageKey);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}
function saveState(s) {
  try { localStorage.setItem(FFStorageKey, JSON.stringify(s)); } catch {}
}

function makeInitialState() {
  const saved = loadState();
  if (saved) return saved;
  return {
    practices: window.SEED_PRACTICES.slice(),
    scenarios: window.SEED_SCENARIOS.slice(),
    activePracticeId: null,
    compareIds: ['s-manukau-base', 's-manukau-aggressive', 's-hataitai-base'],
    firstRun: true, // show onboarding once
  };
}

// Undo/redo stack (last 30 snapshots)
function useHistory(value, setValue, cap = 30) {
  const histRef = React.useRef({ past: [], future: [] });
  const lastValRef = React.useRef(value);

  // push a snapshot (call BEFORE the change)
  const push = React.useCallback(() => {
    histRef.current.past.push(JSON.parse(JSON.stringify(lastValRef.current)));
    if (histRef.current.past.length > cap) histRef.current.past.shift();
    histRef.current.future = [];
  }, [cap]);

  React.useEffect(() => { lastValRef.current = value; }, [value]);

  const undo = React.useCallback(() => {
    const h = histRef.current;
    if (!h.past.length) return false;
    const prev = h.past.pop();
    h.future.push(JSON.parse(JSON.stringify(lastValRef.current)));
    setValue(prev);
    return true;
  }, [setValue]);

  const redo = React.useCallback(() => {
    const h = histRef.current;
    if (!h.future.length) return false;
    const next = h.future.pop();
    h.past.push(JSON.parse(JSON.stringify(lastValRef.current)));
    setValue(next);
    return true;
  }, [setValue]);

  const canUndo = () => histRef.current.past.length > 0;
  const canRedo = () => histRef.current.future.length > 0;

  return { push, undo, redo, canUndo, canRedo };
}

// Toast system
function useToasts() {
  const [toasts, setToasts] = React.useState([]);
  const push = React.useCallback((t) => {
    const id = Math.random().toString(36).slice(2);
    const toast = { id, ...t };
    setToasts(ts => [...ts, toast]);
    setTimeout(() => setToasts(ts => ts.filter(x => x.id !== id)), t.duration || 3500);
  }, []);
  const dismiss = (id) => setToasts(ts => ts.filter(x => x.id !== id));
  return { toasts, push, dismiss };
}

Object.assign(window, { makeInitialState, loadState, saveState, useHistory, useToasts, FFStorageKey });
