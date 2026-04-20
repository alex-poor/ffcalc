// data.jsx — Screen 6: Import / Export
const { Button, ICONS, AGE_BANDS } = window;

const SAMPLE_CSV_ROWS = [
  { practice_name: 'Ōtāhuhu Whānau Ora Clinic', type: 'Access', age_0_4: 412, age_5_14: 1020, age_15_24: 1144, age_25_44: 2080, age_45_64: 1620, age_65: 788, female: 3580, maori_pacific: 4120, dep_q5: 5200, csc: 2140 },
  { practice_name: 'Papanui Medical Centre', type: 'NonAccess', age_0_4: 168, age_5_14: 412, age_15_24: 520, age_25_44: 1100, age_45_64: 1180, age_65: 740, female: 2120, maori_pacific: 280, dep_q5: 180, csc: 310 },
];

const CANONICAL_FIELDS = [
  { key: 'name', label: 'Practice name', required: true },
  { key: 'type', label: 'Practice type (Access/NonAccess)', required: true },
  { key: '0-4', label: 'Age 0-4 count', required: true },
  { key: '5-14', label: 'Age 5-14 count', required: true },
  { key: '15-24', label: 'Age 15-24 count', required: true },
  { key: '25-44', label: 'Age 25-44 count', required: true },
  { key: '45-64', label: 'Age 45-64 count', required: true },
  { key: '65+', label: 'Age 65+ count', required: true },
  { key: 'female', label: 'Female count' },
  { key: 'mp', label: 'Māori + Pacific count' },
  { key: 'dep', label: 'Dep 9-10 count' },
  { key: 'csc', label: 'CSC count' },
];

function DataScreen({ state, setState, onBack, pushToast, pushHistory }) {
  const [stage, setStage] = React.useState('drop'); // drop -> map -> preview -> done
  const [csvCols] = React.useState(['practice_name','type','age_0_4','age_5_14','age_15_24','age_25_44','age_45_64','age_65','female','maori_pacific','dep_q5','csc']);
  const [mapping, setMapping] = React.useState({
    name: 'practice_name', type: 'type',
    '0-4': 'age_0_4', '5-14': 'age_5_14', '15-24': 'age_15_24',
    '25-44': 'age_25_44', '45-64': 'age_45_64', '65+': 'age_65',
    female: 'female', mp: 'maori_pacific', dep: 'dep_q5', csc: 'csc',
  });
  const [dragHover, setDragHover] = React.useState(false);

  const onDrop = (e) => {
    e.preventDefault(); setDragHover(false);
    pushToast({ msg: 'Loaded sample.csv (2 rows)' });
    setStage('map');
  };

  const commit = () => {
    pushHistory();
    const newPractices = SAMPLE_CSV_ROWS.map(row => ({
      id: 'p-' + Math.random().toString(36).slice(2, 9),
      name: row.practice_name,
      practiceType: row.type,
      ageCounts: { '0-4': row.age_0_4, '5-14': row.age_5_14, '15-24': row.age_15_24, '25-44': row.age_25_44, '45-64': row.age_45_64, '65+': row.age_65 },
      femaleCount: row.female, maoriPacificCount: row.maori_pacific, dep9to10Count: row.dep_q5, huhcCount: null, cscCount: row.csc,
      baseline: null,
      created: Date.now(), modified: Date.now(),
    }));
    setState(s => ({ ...s, practices: [...s.practices, ...newPractices] }));
    pushToast({ msg: `Imported ${newPractices.length} practices` });
    setStage('done');
  };

  return (
    <div className="content narrow">
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 20 }}>
        <Button variant="ghost" onClick={onBack} icon={<ICONS.ArrowBack/>}>Register</Button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 4 }}>Import & Export</h1>
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            Bring Karo roster extracts in; push scenario results out. No network — files stay on this machine.
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        <div>
          <div className="card">
            <div className="card-head"><h3>Import CSV</h3></div>
            <div className="card-body">
              <StepperBar stage={stage}/>

              {stage === 'drop' && (
                <div
                  onDragOver={e => { e.preventDefault(); setDragHover(true); }}
                  onDragLeave={() => setDragHover(false)}
                  onDrop={onDrop}
                  onClick={onDrop}
                  style={{
                    marginTop: 14, padding: 40, textAlign: 'center',
                    border: `2px dashed ${dragHover ? 'var(--accent)' : 'var(--border-strong)'}`,
                    background: dragHover ? 'var(--pink-soft)' : 'var(--surface-2)',
                    borderRadius: 'var(--r-lg)', cursor: 'pointer',
                    transition: 'all 0.12s',
                  }}>
                  <div style={{ color: 'var(--accent)', marginBottom: 10 }}><ICONS.Upload size={32}/></div>
                  <div style={{ fontWeight: 600, color: 'var(--text-strong)', marginBottom: 4 }}>
                    Drop a Karo CSV here <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>or click to choose</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                    Expected columns: practice_name, type, age bands, optional marginals
                  </div>
                </div>
              )}

              {stage === 'map' && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>
                    Map your CSV columns to canonical fields. <b style={{ color: 'var(--text-strong)' }}>Auto-detected — review before continuing.</b>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {CANONICAL_FIELDS.map(f => (
                      <div key={f.key} style={{
                        display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, alignItems: 'center',
                        padding: '7px 10px', background: 'var(--surface-2)', borderRadius: 'var(--r)',
                      }}>
                        <div style={{ fontSize: 13 }}>
                          {f.label}
                          {f.required && <span style={{ color: 'var(--accent)', marginLeft: 3 }}>*</span>}
                        </div>
                        <ICONS.Arrow size={12} style={{ color: 'var(--text-dim)' }}/>
                        <select className="input" style={{ fontSize: 12.5, padding: '4px 8px' }}
                          value={mapping[f.key] || ''}
                          onChange={e => setMapping(m => ({ ...m, [f.key]: e.target.value }))}>
                          <option value="">— not mapped —</option>
                          {csvCols.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
                    <Button variant="ghost" onClick={() => setStage('drop')}>Back</Button>
                    <Button variant="primary" onClick={() => setStage('preview')}>Preview →</Button>
                  </div>
                </div>
              )}

              {stage === 'preview' && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>
                    Preview — <b style={{ color: 'var(--text-strong)' }}>{SAMPLE_CSV_ROWS.length} practices</b> will be created.
                  </div>
                  <table className="table" style={{ fontSize: 12.5 }}>
                    <thead>
                      <tr><th>Name</th><th>Type</th><th className="num">Total</th><th className="num">MP</th><th className="num">Q5</th><th className="num">CSC</th></tr>
                    </thead>
                    <tbody>
                      {SAMPLE_CSV_ROWS.map((r, i) => {
                        const tot = r.age_0_4 + r.age_5_14 + r.age_15_24 + r.age_25_44 + r.age_45_64 + r.age_65;
                        return (
                          <tr key={i}>
                            <td>{r.practice_name}</td>
                            <td>{r.type}</td>
                            <td className="num">{window.fmtNumber(tot)}</td>
                            <td className="num">{window.fmtNumber(r.maori_pacific)}</td>
                            <td className="num">{window.fmtNumber(r.dep_q5)}</td>
                            <td className="num">{window.fmtNumber(r.csc)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
                    <Button variant="ghost" onClick={() => setStage('map')}>Back</Button>
                    <Button variant="primary" onClick={commit} icon={<ICONS.Check/>}>Commit to register</Button>
                  </div>
                </div>
              )}

              {stage === 'done' && (
                <div style={{ marginTop: 14, padding: 24, background: 'var(--pink-soft)', borderRadius: 'var(--r)', textAlign: 'center' }}>
                  <div style={{ color: 'var(--accent)', marginBottom: 8 }}><ICONS.Check size={28}/></div>
                  <div style={{ fontWeight: 600, color: 'var(--text-strong)' }}>Import complete</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, marginBottom: 14 }}>
                    {SAMPLE_CSV_ROWS.length} practices added to the register.
                  </div>
                  <Button variant="primary" onClick={onBack}>Back to register</Button>{' '}
                  <Button variant="ghost" onClick={() => setStage('drop')}>Import another</Button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <div className="card">
            <div className="card-head"><h3>Export</h3></div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <ExportRow icon={<ICONS.Download/>} title="All scenarios" desc="CSV · one row per scenario with stream totals"
                onClick={() => pushToast({msg: 'Exported scenarios.csv'})}/>
              <ExportRow icon={<ICONS.File/>} title="Current comparison" desc="CSV or PDF"
                onClick={() => pushToast({msg: 'Exported comparison.csv'})}/>
              <ExportRow icon={<ICONS.Book/>} title="Rate tables" desc="CSV · all four streams"
                onClick={() => pushToast({msg: 'Exported rates.csv'})}/>
            </div>
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-head"><h3>Expected CSV schema</h3></div>
            <div className="card-body" style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.7 }}>
              <div style={{ marginBottom: 6, color: 'var(--text-strong)', fontWeight: 500 }}>Required columns</div>
              practice_name · type · age_0_4 · age_5_14 · age_15_24 · age_25_44 · age_45_64 · age_65
              <div style={{ marginTop: 10, marginBottom: 6, color: 'var(--text-strong)', fontWeight: 500 }}>Optional</div>
              female · maori_pacific · dep_q5 · csc · huhc
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepperBar({ stage }) {
  const steps = [{ k: 'drop', label: 'Upload' }, { k: 'map', label: 'Map columns' }, { k: 'preview', label: 'Preview' }, { k: 'done', label: 'Commit' }];
  const currIdx = steps.findIndex(s => s.k === stage);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {steps.map((s, i) => (
        <React.Fragment key={s.k}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            color: i <= currIdx ? 'var(--accent)' : 'var(--text-dim)',
            fontSize: 12.5, fontWeight: 500,
          }}>
            <span style={{
              width: 20, height: 20, borderRadius: 50, display: 'grid', placeItems: 'center',
              background: i <= currIdx ? 'var(--accent)' : 'var(--surface-2)',
              color: i <= currIdx ? 'white' : 'var(--text-dim)',
              fontSize: 11, fontWeight: 700,
            }}>{i < currIdx ? '✓' : i + 1}</span>
            {s.label}
          </div>
          {i < steps.length - 1 && <div style={{ flex: 1, height: 1, background: 'var(--border)' }}/>}
        </React.Fragment>
      ))}
    </div>
  );
}

function ExportRow({ icon, title, desc, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 12px', background: 'transparent', border: '1px solid var(--border)',
      borderRadius: 'var(--r)', cursor: 'pointer', textAlign: 'left',
    }}
    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--pink-soft)', color: 'var(--accent)', display: 'grid', placeItems: 'center' }}>
        {React.cloneElement(icon, { size: 17 })}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-strong)' }}>{title}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{desc}</div>
      </div>
      <ICONS.Chevron size={14} style={{ color: 'var(--text-dim)' }}/>
    </button>
  );
}

window.DataScreen = DataScreen;
