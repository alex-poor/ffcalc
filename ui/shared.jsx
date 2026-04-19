// shared.jsx — small shared UI primitives used across screens

const { ICONS } = window;

function Button({ children, variant = 'default', size, icon, onClick, disabled, title, type = 'button', className = '', ...rest }) {
  const cls = ['btn'];
  if (variant !== 'default') cls.push(variant);
  if (size) cls.push(size);
  if (className) cls.push(className);
  return (
    <button type={type} className={cls.join(' ')} onClick={onClick} disabled={disabled} title={title} {...rest}>
      {icon}{children}
    </button>
  );
}

function Modal({ open, title, onClose, children, footer, width = 480 }) {
  if (!open) return null;
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal fade-in" style={{ maxWidth: width }} onClick={e => e.stopPropagation()}>
        {title && <div className="modal-head"><h3>{title}</h3></div>}
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

function TypeChip({ type }) {
  if (type === 'Access') return <span className="chip access">VLCA · Access</span>;
  return <span className="chip nonaccess">Non-Access</span>;
}

function VarianceChip({ value, showPct, total }) {
  if (value == null || !isFinite(value)) return <span className="chip">—</span>;
  if (Math.abs(value) < 100) return <span className="chip">≈ 0</span>;
  const pos = value >= 0;
  const pct = total ? ` · ${(value / total * 100).toFixed(1)}%` : '';
  return (
    <span className={'chip ' + (pos ? 'pos' : 'neg')}>
      {pos ? '▲' : '▼'} {window.fmtCurrency(Math.abs(value), { compact: true })}{showPct && pct}
    </span>
  );
}

// Stacked bar: pass items = [{label, value, color}]
function StackedBar({ items, height = 8, showLabels = false, total: totalOverride }) {
  const total = totalOverride ?? items.reduce((s, i) => s + i.value, 0);
  return (
    <div>
      <div style={{
        display: 'flex', width: '100%', height,
        borderRadius: height / 2, overflow: 'hidden',
        background: 'var(--surface-2)',
      }}>
        {items.map((it, i) => {
          const w = total > 0 ? (it.value / total * 100) : 0;
          return (
            <div key={i} style={{
              width: w + '%', background: it.color,
              transition: 'width 0.18s ease-out',
            }} title={`${it.label}: ${window.fmtCurrency(it.value)}`}/>
          );
        })}
      </div>
      {showLabels && (
        <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
          {items.map((it, i) => (
            <span key={i} style={{ fontSize: 12, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: it.color, display: 'inline-block' }}/>
              {it.label} <span className="num" style={{ color: 'var(--text-strong)', fontWeight: 500 }}>
                {total > 0 ? ((it.value / total) * 100).toFixed(0) : 0}%
              </span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// Sparkline — tiny contribution bar
function Sparkline({ value, max, color = 'var(--accent)' }) {
  const pct = max > 0 ? Math.min(100, value / max * 100) : 0;
  return (
    <div style={{
      height: 4, background: 'var(--surface-2)', borderRadius: 100, overflow: 'hidden',
    }}>
      <div style={{
        width: pct + '%', height: '100%', background: color,
        transition: 'width 0.18s ease-out',
      }}/>
    </div>
  );
}

// Stream colors (consistent across app)
const STREAM_COLORS = {
  firstLevel: 'var(--red)',
  hop: 'var(--navy)',
  sia: 'var(--amber)',
  careplus: 'var(--mint)',
};
const STREAM_KEYS = ['firstLevel', 'hop', 'sia', 'careplus'];
const STREAM_LABELS = {
  firstLevel: 'First-Level',
  hop: 'HOP',
  sia: 'SIA',
  careplus: 'CarePlus',
};

function Money({ value, className = '', compact = false, decimals = 0 }) {
  return <span className={'num ' + className}>{window.fmtCurrency(value, { compact, decimals })}</span>;
}

function MoneyLarge({ value, small }) {
  return (
    <div>
      <span className="num" style={{ fontSize: small ? 18 : 24, fontWeight: 600, color: 'var(--text-strong)', letterSpacing: '-0.015em' }}>
        {window.fmtCurrency(value)}
      </span>
    </div>
  );
}

Object.assign(window, { Button, Modal, TypeChip, VarianceChip, StackedBar, Sparkline, STREAM_COLORS, STREAM_KEYS, STREAM_LABELS, Money, MoneyLarge });
