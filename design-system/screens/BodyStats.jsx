/* eslint-disable */
// Body Stats — Henna & Pearl
// Weight / waist / BMI history. Pink-tinted. Line chart + recent entries.

const BodyStatsScreen = ({ onMenu }) => {
  const weights = [
    { d: '5 May',  w: 68.2 }, { d: '12 May', w: 67.8 }, { d: '15 May', w: 67.5 },
    { d: '18 May', w: 67.2 }, { d: '22 May', w: 66.9 }, { d: '26 May', w: 66.4 },
  ];
  const max = Math.max(...weights.map(d => d.w));
  const min = Math.min(...weights.map(d => d.w));
  const W = 320, H = 120;
  const pts = weights.map((d, i) => {
    const x = (i / (weights.length - 1)) * W;
    const y = H - ((d.w - min) / (max - min || 1)) * H;
    return [x, y];
  });
  const path = pts.map((p, i) => (i === 0 ? `M ${p[0]} ${p[1]}` : `L ${p[0]} ${p[1]}`)).join(' ');

  return (
    <div style={{ position: 'relative', height: '100%', background: 'var(--page-grad)', overflow: 'hidden' }}>
      <PaperNoise />
      <div style={{ position: 'relative', height: '100%', overflowY: 'auto', paddingBottom: 180 }}>
        <HennaHeader title="Body Stats" subtitle="Track your goals privately" onMenu={onMenu} action={<HennaIcon name="lock" size={16} color="var(--muted)" />} />

        <div style={{ padding: '0 16px' }}>
          <div style={{
            background: 'linear-gradient(160deg, #F1E4DD 0%, #E5D0C5 100%)',
            borderRadius: 28, padding: '22px 24px',
            boxShadow: '0 10px 30px rgba(156,106,106,0.16), inset 0 0 0 1px rgba(255,255,255,0.5)',
            position: 'relative', overflow: 'hidden',
          }}>
            <MeshOverlay />
            <div style={{ position: 'absolute', top: -6, right: -6 }}>
              <ArabesqueCorner size={110} color="#9C6A6A" opacity={0.16} />
            </div>
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MarginMark color="var(--pink)" />
                <div className="eyebrow" style={{ color: 'var(--pink)' }}>Current weight</div>
              </div>
              <div className="display-num" style={{ marginTop: 8 }}>
                66.<span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontWeight: 600, color: 'var(--pink)' }}>4</span>
                <span style={{ fontFamily: 'var(--serif)', fontSize: 18, color: 'var(--ink-2)', marginLeft: 6 }}>kg</span>
              </div>
              <div style={{ fontFamily: 'var(--ui)', fontSize: 12, color: 'var(--ink-2)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <HennaIcon name="chev-down" size={11} color="var(--sage)" />
                <span><strong style={{ color: 'var(--sage)' }}>1.8 kg lost</strong> · 3 weeks · BMI 24.1</span>
              </div>

              <div style={{ marginTop: 16, padding: 12, background: 'rgba(255,255,255,0.6)', borderRadius: 16 }}>
                <svg width="100%" height={H + 30} viewBox={`-10 -10 ${W + 20} ${H + 30}`} preserveAspectRatio="none">
                  {/* Grid lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map(p => (
                    <line key={p} x1="0" x2={W} y1={p * H} y2={p * H} stroke="rgba(147,73,57,0.08)" strokeWidth="1" />
                  ))}
                  {/* Filled area */}
                  <path d={`${path} L ${W} ${H} L 0 ${H} Z`} fill="rgba(156,106,106,0.12)" />
                  {/* Line */}
                  <path d={path} fill="none" stroke="#9C6A6A" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                  {/* Points */}
                  {pts.map((p, i) => (
                    <circle key={i} cx={p[0]} cy={p[1]} r={i === pts.length - 1 ? 5 : 3} fill="#9C6A6A" stroke="#FFFCF5" strokeWidth="2" />
                  ))}
                  {/* X axis */}
                  {weights.map((d, i) => (
                    <text key={i} x={(i / (weights.length - 1)) * W} y={H + 18} fontSize="9" fill="rgba(60,40,20,0.5)" textAnchor="middle" fontFamily="DM Sans">{d.d}</text>
                  ))}
                </svg>
              </div>
            </div>
          </div>
        </div>

        <DividerOrnament style={{ padding: '22px 32px 10px' }} color="var(--pink)" />

        <div className="eyebrow" style={{ padding: '0 24px 12px', textAlign: 'center' }}>Other measures</div>
        <div style={{ padding: '0 16px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {[
            { name: 'Waist',  val: '76 cm',     icon: 'body', accent: 'pink' },
            { name: 'BMI',    val: '24.1',      icon: 'goal', accent: 'sage' },
            { name: 'Water',  val: '6 / 8 cups',icon: 'water',accent: 'plum' },
          ].map(s => (
            <HennaCard key={s.name} padding={14}>
              <div style={{
                width: 32, height: 32, borderRadius: 16,
                background: `var(--${s.accent}-bg)`, color: `var(--${s.accent})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <HennaIcon name={s.icon} size={16} />
              </div>
              <div className="eyebrow" style={{ marginTop: 10 }}>{s.name}</div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 16, color: 'var(--ink)', marginTop: 2 }}>{s.val}</div>
            </HennaCard>
          ))}
        </div>

        <div style={{ padding: '14px 16px 0' }}>
          <HennaButton variant="primary" full icon="plus">Log measurement</HennaButton>
        </div>
      </div>
    </div>
  );
};

window.BodyStatsScreen = BodyStatsScreen;
