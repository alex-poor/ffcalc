// rates.jsx — Screen 5: Rate Reference (matrix tables from real engine rate data)

const { Button, ICONS } = window;

// Per-stream column config: which fields of the rate row to render, and how.
const STREAM_TABLES = {
  firstLevel: {
    data: () => window.FIRST_LEVEL_RATES,
    columns: [
      { key: 'practiceType', label: 'Practice',  fmt: (v) => v === 'Access' ? 'VLCA · Access' : 'Non-Access' },
      { key: 'ageBand',      label: 'Age band' },
      { key: 'gender',       label: 'Sex',       fmt: (v) => v === 'F' ? 'Female' : 'Male' },
      { key: 'huhc',         label: 'HUHC' },
      { key: 'rate',         label: 'Rate ($/yr)', num: true },
    ],
    extra: () => <CscTopupTable/>,
  },
  hop: {
    data: () => window.HOP_RATES,
    columns: [
      { key: 'ethnicity', label: 'Ethnicity', fmt: (v) => v === 'maori-pacific' ? 'Māori/Pacific' : 'Non-Māori/Pacific' },
      { key: 'depBand',   label: 'Deprivation', fmt: (v) => v === 'dep9-10' ? 'Dep 9-10 (Q5)' : 'Dep 1-8' },
      { key: 'rate',      label: 'Rate ($/yr)', num: true },
    ],
  },
  sia: {
    data: () => window.SIA_RATES,
    columns: [
      { key: 'ageBand',   label: 'Age band' },
      { key: 'gender',    label: 'Sex',       fmt: (v) => v === 'F' ? 'Female' : 'Male' },
      { key: 'ethnicity', label: 'Ethnicity', fmt: (v) => v === 'maori-pacific' ? 'Māori/Pacific' : 'Non-M/P' },
      { key: 'depBand',   label: 'Deprivation', fmt: (v) => v === 'dep9-10' ? 'Dep 9-10' : 'Dep 1-8' },
      { key: 'rate',      label: 'Rate ($/yr)', num: true },
    ],
  },
  careplus: {
    data: () => window.CAREPLUS_RATES,
    columns: [
      { key: 'ageBand',   label: 'Age band' },
      { key: 'gender',    label: 'Sex',       fmt: (v) => v === 'F' ? 'Female' : 'Male' },
      { key: 'depBand',   label: 'Deprivation', fmt: (v) => v === 'dep9-10' ? 'Dep 9-10 (Q5)' : 'Dep 1-8' },
      { key: 'ethnicity', label: 'Ethnicity', fmt: (v) => v === 'maori-pacific' ? 'Māori/Pacific' : 'Non-M/P' },
      { key: 'rate',      label: 'Rate ($/yr)', num: true },
    ],
  },
};

function Rates({ onBack, pushToast }) {
  const [tab, setTab] = React.useState('firstLevel');
  const [query, setQuery] = React.useState('');

  const meta = window.RATES_META[tab];
  const cfg = STREAM_TABLES[tab];

  return (
    <div className="content wide">
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 20 }}>
        <Button variant="ghost" onClick={onBack} icon={<ICONS.ArrowBack/>}>Register</Button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 4 }}>Rate Reference</h1>
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            Authoritative read-only view of the rate tables used by the engine.
          </div>
        </div>
      </div>

      <div className="seg" style={{ marginBottom: 16 }}>
        {Object.entries(window.RATES_META).map(([k, v]) => (
          <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{v.shortName}</button>
        ))}
      </div>

      <div className="card">
        <div className="card-head" style={{ padding: '16px 20px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontSize: 16 }}>{meta.name}</h3>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 4 }}>
              Effective <b style={{ color: 'var(--text-strong)' }}>{meta.effective}</b> · {meta.source}
              {meta.sourceUrl && meta.sourceUrl !== '#' && <>
                {' · '}
                <a href={meta.sourceUrl} target="_blank" rel="noopener noreferrer"
                   style={{ color: 'var(--accent)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                  View source <ICONS.External size={12}/>
                </a>
              </>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ position: 'relative' }}>
              <ICONS.Search size={14} style={{ position: 'absolute', left: 10, top: 9, color: 'var(--text-muted)' }}/>
              <input className="input" placeholder="Filter rows…" style={{ paddingLeft: 32, width: 200 }}
                value={query} onChange={e => setQuery(e.target.value)}/>
            </div>
            <Button size="sm" onClick={() => pushToast({ msg: 'Rate table CSV exported' })} icon={<ICONS.Download/>}>CSV</Button>
          </div>
        </div>
        <div className="card-body" style={{ padding: 0, maxHeight: 600, overflowY: 'auto' }}>
          <MatrixTable cfg={cfg} query={query} pushToast={pushToast}/>
        </div>
      </div>

      {cfg.extra && <div style={{ marginTop: 16 }}>{cfg.extra()}</div>}

      <div style={{ marginTop: 14, padding: '14px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', fontSize: 13, color: 'var(--text-muted)' }}>
        <b style={{ color: 'var(--text-strong)' }}>Notes:</b> {meta.notes}
      </div>
    </div>
  );
}

function MatrixTable({ cfg, query, pushToast }) {
  const q = query.trim().toLowerCase();
  const rows = cfg.data().filter(row => {
    if (!q) return true;
    return cfg.columns.some(col => {
      const raw = row[col.key];
      const str = (col.fmt ? col.fmt(raw) : String(raw)).toLowerCase();
      return str.includes(q);
    });
  });
  return (
    <table className="table">
      <thead>
        <tr>
          {cfg.columns.map(c => <th key={c.key} className={c.num ? 'num' : ''}>{c.label}</th>)}
          <th style={{ width: 60 }}></th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            {cfg.columns.map(c => {
              const raw = r[c.key];
              const content = c.num
                ? window.fmtCurrency(raw, { decimals: 4 })
                : (c.fmt ? c.fmt(raw) : raw);
              return <td key={c.key} className={c.num ? 'num' : ''} style={c.num ? { fontWeight: 500 } : undefined}>{content}</td>;
            })}
            <td>
              <button className="btn ghost sm" title="Copy rate to clipboard"
                onClick={() => { navigator.clipboard?.writeText(String(r.rate)); pushToast({ msg: 'Rate copied' }); }}>
                <ICONS.Copy size={12}/>
              </button>
            </td>
          </tr>
        ))}
        {rows.length === 0 && (
          <tr><td colSpan={cfg.columns.length + 1} style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '24px 0' }}>No rows match "{query}"</td></tr>
        )}
      </tbody>
    </table>
  );
}

function CscTopupTable() {
  return (
    <div className="card">
      <div className="card-head" style={{ padding: '14px 18px' }}>
        <h3 style={{ fontSize: 14 }}>CSC top-up rates</h3>
        <span className="sub" style={{ marginLeft: 'auto', color: 'var(--text-dim)' }}>Applied to Non-Access CSC=Y patients</span>
      </div>
      <div className="card-body" style={{ padding: 0 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Age band</th><th>Sex</th><th className="num">Top-up ($/yr)</th>
            </tr>
          </thead>
          <tbody>
            {window.CSC_TOPUP_RATES.map((r, i) => (
              <tr key={i}>
                <td>{r.ageBand}</td>
                <td>{r.gender === 'F' ? 'Female' : 'Male'}</td>
                <td className="num" style={{ fontWeight: 500 }}>{window.fmtCurrency(r.rate, { decimals: 4 })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

window.Rates = Rates;
