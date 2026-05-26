/* eslint-disable */
// Henna & Pearl — Ornaments
// Tiny hand-drawn arabesque, divider, and corner pieces. Inline SVG so they
// inherit currentColor and scale crisply. Used on hero cards + section heads
// + screen titles to make the page feel illuminated, not generic.

// Arabesque corner piece — sits at top-right or any corner of a hero card.
// Single curving stem with three leaves + a centered dot.
const ArabesqueCorner = ({ size = 90, color = 'currentColor', opacity = 0.18, style }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{ ...style }} aria-hidden="true">
    <g fill="none" stroke={color} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity={opacity}>
      {/* Stem sweep */}
      <path d="M 95 5 Q 70 25 50 50 Q 30 75 5 95" />
      {/* Outer curl */}
      <path d="M 95 5 Q 88 22 70 30 Q 78 40 92 30" />
      {/* Mid leaf */}
      <path d="M 50 50 Q 35 38 28 50 Q 38 60 50 50" />
      <path d="M 50 50 Q 65 62 72 50 Q 62 40 50 50" />
      {/* Inner small leaf */}
      <path d="M 25 75 Q 18 68 12 75 Q 18 82 25 75" />
      {/* Dots */}
      <circle cx="50" cy="50" r="1.2" fill={color} stroke="none" />
      <circle cx="76" cy="32" r="0.8" fill={color} stroke="none" />
      <circle cx="22" cy="78" r="0.8" fill={color} stroke="none" />
    </g>
  </svg>
);

// Ornamental section divider — small leaf flourish between sections
const DividerOrnament = ({ color = 'var(--henna)', size = 22, style }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, ...style }}>
    <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
    <svg width={size * 3} height={size} viewBox="0 0 66 22" aria-hidden="true">
      <g fill="none" stroke={color} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
        {/* Centre diamond */}
        <path d="M 33 6 L 38 11 L 33 16 L 28 11 Z" />
        <circle cx="33" cy="11" r="1" fill={color} stroke="none" />
        {/* Left curl */}
        <path d="M 26 11 Q 20 6 14 11 Q 20 13 26 11" />
        {/* Right curl */}
        <path d="M 40 11 Q 46 6 52 11 Q 46 13 40 11" />
        {/* End dots */}
        <circle cx="10" cy="11" r="1" fill={color} stroke="none" />
        <circle cx="56" cy="11" r="1" fill={color} stroke="none" />
      </g>
    </svg>
    <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
  </div>
);

// Compact inline ornament — a single trefoil glyph for inline use
// (in section heads, alongside titles, etc.)
const Trefoil = ({ size = 14, color = 'currentColor', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'inline-block', verticalAlign: 'middle', ...style }} aria-hidden="true">
    <g fill="none" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M 12 4 Q 10 9 12 12 Q 14 9 12 4" />
      <path d="M 4 12 Q 9 10 12 12 Q 9 14 4 12" />
      <path d="M 20 12 Q 15 10 12 12 Q 15 14 20 12" />
      <circle cx="12" cy="12" r="1" fill={color} stroke="none" />
    </g>
  </svg>
);

// Illuminated drop-cap mark — used to the left of screen titles
const Drop = ({ size = 28, color = 'var(--henna)', bg = 'var(--henna-bg)', style }) => (
  <div style={{
    width: size, height: size, borderRadius: 8,
    background: bg, color,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: 'inset 0 0 0 1px ' + color + '33',
    flexShrink: 0,
    ...style,
  }}>
    <Trefoil size={size * 0.55} />
  </div>
);

// Tiny side mark — used to the LEFT of section heads, like an illuminated
// margin glyph in a manuscript
const MarginMark = ({ color = 'var(--henna)', style }) => (
  <svg width="10" height="20" viewBox="0 0 10 20" style={{ ...style }} aria-hidden="true">
    <g fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round">
      <path d="M 5 2 L 5 18" />
      <circle cx="5" cy="6" r="1.4" fill={color} />
      <circle cx="5" cy="14" r="1.4" fill={color} />
    </g>
  </svg>
);

// Subtle radial-mesh background — used as overlay on hero gradients
const MeshOverlay = ({ style }) => (
  <div style={{
    position: 'absolute', inset: 0, pointerEvents: 'none',
    backgroundImage:
      'radial-gradient(ellipse 70% 50% at 20% 30%, rgba(255,255,255,0.45), transparent 60%),' +
      'radial-gradient(ellipse 60% 40% at 80% 80%, rgba(147,73,57,0.10), transparent 60%)',
    ...style,
  }} />
);

Object.assign(window, { ArabesqueCorner, DividerOrnament, Trefoil, Drop, MarginMark, MeshOverlay });
