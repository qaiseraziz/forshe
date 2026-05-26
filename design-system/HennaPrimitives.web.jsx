/* eslint-disable */
// Henna & Pearl — UI primitives
// All components share the soft-luxe vocab: 28-radius cards with inset
// hairline, henna-tinted shadows, serif headers, hand-drawn icons.

const HennaCard = ({ children, style, bg, accent, padding = 20, onClick }) => (
  <div onClick={onClick} style={{
    background: bg || 'var(--paper)',
    borderRadius: 'var(--r-card)',
    padding,
    boxShadow: 'var(--shadow-md), inset 0 0 0 1px ' + (accent ? accent + '14' : 'rgba(147,73,57,0.06)'),
    position: 'relative',
    cursor: onClick ? 'pointer' : 'default',
    ...style,
  }}>
    {children}
  </div>
);

const HennaButton = ({ children, onClick, variant = 'primary', size = 'md', full, icon, style, disabled }) => {
  const variants = {
    primary:   { bg: 'var(--henna)',  fg: 'var(--paper)', shadow: '0 4px 12px rgba(147,73,57,0.25)' },
    sage:      { bg: 'var(--sage)',   fg: 'var(--paper)', shadow: '0 4px 12px rgba(126,156,112,0.25)' },
    bronze:    { bg: 'var(--bronze)', fg: 'var(--paper)', shadow: '0 4px 12px rgba(176,122,58,0.25)' },
    plum:      { bg: 'var(--plum)',   fg: 'var(--paper)', shadow: '0 4px 12px rgba(106,88,145,0.25)' },
    soft:      { bg: 'var(--henna-bg)', fg: 'var(--henna)', shadow: 'none' },
    outline:   { bg: 'transparent', fg: 'var(--ink)', border: '1.5px solid var(--line-strong)', shadow: 'none' },
    ghost:     { bg: 'transparent', fg: 'var(--ink-2)', shadow: 'none' },
  };
  const v = variants[variant] || variants.primary;
  const sizes = { sm: { p: '8px 14px', f: 12 }, md: { p: '12px 18px', f: 13 }, lg: { p: '14px 22px', f: 15 } };
  const s = sizes[size] || sizes.md;
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: v.bg, color: v.fg,
      padding: s.p, borderRadius: 'var(--r-pill)',
      border: v.border || 0,
      fontFamily: 'var(--ui)', fontWeight: 600, fontSize: s.f, letterSpacing: 0.2,
      boxShadow: v.shadow, cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      width: full ? '100%' : 'auto',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      ...style,
    }}>
      {icon && <HennaIcon name={icon} size={14} />}
      {children}
    </button>
  );
};

const HennaPill = ({ children, active, onClick, accent = 'henna', icon, style }) => {
  const accentVars = {
    henna:  { fg: 'var(--henna)',  bg: 'var(--henna-bg)' },
    sage:   { fg: 'var(--sage)',   bg: 'var(--sage-bg)' },
    bronze: { fg: 'var(--bronze)', bg: 'var(--bronze-bg)' },
    plum:   { fg: 'var(--plum)',   bg: 'var(--plum-bg)' },
    pink:   { fg: 'var(--pink)',   bg: 'var(--pink-bg)' },
  };
  const a = accentVars[accent] || accentVars.henna;
  return (
    <button onClick={onClick} style={{
      background: active ? a.bg : 'var(--paper-2)',
      color: active ? a.fg : 'var(--muted)',
      border: 0, padding: '8px 14px', borderRadius: 'var(--r-pill)',
      fontFamily: 'var(--ui)', fontWeight: 600, fontSize: 12,
      cursor: 'pointer', whiteSpace: 'nowrap',
      display: 'inline-flex', alignItems: 'center', gap: 6,
      minHeight: 36,
      ...style,
    }}>
      {icon && <HennaIcon name={icon} size={13} />}
      {children}
    </button>
  );
};

const HennaInput = ({ label, value, placeholder, icon, onChange, style }) => (
  <div style={style}>
    {label && <div className="eyebrow" style={{ marginBottom: 8 }}>{label}</div>}
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      background: 'var(--paper-2)',
      borderRadius: 'var(--r-input)',
      padding: '12px 16px',
      boxShadow: 'inset 0 0 0 1px var(--line)',
    }}>
      {icon && <HennaIcon name={icon} size={16} color="var(--muted)" />}
      <input
        value={value || ''}
        onChange={e => onChange && onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          flex: 1, background: 'transparent', border: 0, outline: 'none',
          fontFamily: 'var(--ui)', fontSize: 14, color: 'var(--ink)',
        }}
      />
    </div>
  </div>
);

const HennaBadge = ({ children, accent = 'henna', style }) => {
  const accentVars = {
    henna:  { fg: 'var(--henna)',  bg: 'var(--henna-bg)' },
    sage:   { fg: 'var(--sage)',   bg: 'var(--sage-bg)' },
    bronze: { fg: 'var(--bronze)', bg: 'var(--bronze-bg)' },
    plum:   { fg: 'var(--plum)',   bg: 'var(--plum-bg)' },
    pink:   { fg: 'var(--pink)',   bg: 'var(--pink-bg)' },
    dust:   { fg: 'var(--dust)',   bg: 'var(--dust-bg)' },
  };
  const a = accentVars[accent] || accentVars.henna;
  return (
    <span style={{
      background: a.bg, color: a.fg,
      fontFamily: 'var(--ui)', fontWeight: 600, fontSize: 10,
      letterSpacing: 0.5,
      padding: '4px 10px', borderRadius: 'var(--r-pill)',
      display: 'inline-flex', alignItems: 'center', gap: 4,
      ...style,
    }}>{children}</span>
  );
};

const HennaProgress = ({ value, max = 100, accent = 'henna', height = 6 }) => {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const fill = {
    henna: 'linear-gradient(90deg, #B86553, #934939)',
    sage:  'linear-gradient(90deg, #99B68A, #7E9C70)',
    bronze:'linear-gradient(90deg, #C99548, #B07A3A)',
    plum:  'linear-gradient(90deg, #8975AA, #6A5891)',
  }[accent];
  return (
    <div style={{ background: 'rgba(147,73,57,0.10)', borderRadius: 999, height, overflow: 'hidden' }}>
      <div style={{ width: pct + '%', height, background: fill, borderRadius: 999 }} />
    </div>
  );
};

// Paper-noise overlay shared across many surfaces
const PaperNoise = ({ opacity = 0.7 }) => (
  <div style={{
    position: 'absolute', inset: 0, pointerEvents: 'none',
    backgroundImage: 'var(--paper-noise)',
    backgroundSize: 'var(--paper-grain)',
    opacity,
  }} />
);

// Status bar — minimal, theme-neutral, used inside all phone frames
const HennaStatusBar = ({ dark }) => (
  <div style={{
    height: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '0 24px', fontSize: 11, fontWeight: 700,
    color: dark ? '#FAF6EE' : '#3D362E',
  }}>
    <span>9:30</span>
    <span style={{ width: 6, height: 6, borderRadius: 3, background: 'currentColor' }} />
    <span>100%</span>
  </div>
);

// Section heading with hairline rule
const HennaSectionHead = ({ title, action, style }) => (
  <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, padding: '20px 24px 12px', ...style }}>
    <div className="section-head">{title}</div>
    <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
    {action && <div style={{ fontFamily: 'var(--ui)', fontSize: 11, fontWeight: 600, color: 'var(--henna)' }}>{action}</div>}
  </div>
);

Object.assign(window, {
  HennaCard, HennaButton, HennaPill, HennaInput, HennaBadge,
  HennaProgress, PaperNoise, HennaStatusBar, HennaSectionHead,
});
