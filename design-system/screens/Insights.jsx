/* eslint-disable */
// Insights — Henna & Pearl
// Spending chart + category breakdown + month-over-month comparison.

const InsightsScreen = ({ onMenu }) => {
  // Last 7 days bar chart data (Mon-Sun)
  const week = [
    { day: 'Mon', val: 1200 }, { day: 'Tue', val: 600 }, { day: 'Wed', val: 2400 },
    { day: 'Thu', val: 800 }, { day: 'Fri', val: 1850 }, { day: 'Sat', val: 3200 }, { day: 'Sun', val: 750 },
  ];
  const maxVal = Math.max(...week.map(d => d.val));
  const fmt = n => 'Rs ' + n.toLocaleString('en-PK');

  const cats = [
    { name: 'Food',      val: 8200,  pct: 31, accent: 'henna',  icon: 'pot' },
    { name: 'Bills',     val: 6050,  pct: 23, accent: 'plum',   icon: 'electricity' },
    { name: 'Transport', val: 4800,  pct: 18, accent: 'bronze', icon: 'car' },
    { name: 'Shopping',  val: 3900,  pct: 15, accent: 'pink',   icon: 'cart' },
    { name: 'Health',    val: 2200,  pct: 8,  accent: 'sage',   icon: 'pill' },
    { name: 'Other',     val: 1300,  pct: 5,  accent: 'dust',   icon: 'list' },
  ];

  return (
    <div style={{ position: 'relative', height: '100%', background: 'var(--page-grad)', overflow: 'hidden' }}>
      <PaperNoise />
      <div style={{ position: 'relative', height: '100%', overflowY: 'auto', paddingBottom: 180 }}>
        <HennaHeader title="Insights" subtitle="Week of 20 May · spending overview" onMenu={onMenu} />

        <div style={{ padding: '0 16px' }}>
          <div style={{
            background: 'linear-gradient(160deg, #E2EAD8 0%, #CFD9C2 100%)',
            borderRadius: 28, padding: '22px 24px',
            boxShadow: '0 10px 30px rgba(126,156,112,0.16), inset 0 0 0 1px rgba(255,255,255,0.5)',
            position: 'relative', overflow: 'hidden',
          }}>
            <MeshOverlay />
            <div style={{ position: 'absolute', top: -6, right: -6 }}>
              <ArabesqueCorner size={110} color="#7E9C70" opacity={0.18} />
            </div>
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MarginMark color="var(--sage)" />
                <div className="eyebrow" style={{ color: 'var(--sage)' }}>Spent this week</div>
              </div>
              <div className="display-num" style={{ marginTop: 8 }}>
                Rs 10,<span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontWeight: 600, color: 'var(--sage)' }}>800</span>
              </div>
              <div style={{ fontFamily: 'var(--ui)', fontSize: 12, color: 'var(--ink-2)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <HennaIcon name="chev-down" size={11} style={{ transform: 'rotate(180deg)' }} color="var(--sage)" />
                <span><strong style={{ color: 'var(--sage)' }}>12% less</strong> than last week</span>
              </div>

              {/* Bar chart */}
              <div style={{ marginTop: 16, display: 'flex', alignItems: 'flex-end', gap: 6, height: 90 }}>
                {week.map(d => {
                  const h = Math.round((d.val / maxVal) * 80);
                  const isPeak = d.val === maxVal;
                  return (
                    <div key={d.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div style={{
                        width: '100%',
                        height: h,
                        borderRadius: 6,
                        background: isPeak
                          ? 'linear-gradient(180deg, #B86553, #934939)'
                          : 'linear-gradient(180deg, rgba(147,73,57,0.4), rgba(147,73,57,0.6))',
                        boxShadow: isPeak ? '0 4px 12px rgba(147,73,57,0.3)' : 'none',
                      }} />
                      <div style={{ fontFamily: 'var(--ui)', fontSize: 9, color: 'var(--muted)' }}>{d.day}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <DividerOrnament style={{ padding: '22px 32px 10px' }} color="var(--henna)" />

        {/* Category breakdown */}
        <div className="eyebrow" style={{ padding: '0 24px 12px', textAlign: 'center' }}>By category</div>
        <div style={{ padding: '0 16px' }}>
          <HennaCard padding={0}>
            {cats.map((c, i) => (
              <div key={c.name} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 18px',
                borderBottom: i < cats.length - 1 ? '1px solid var(--line)' : 'none',
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 16,
                  background: `var(--${c.accent}-bg)`, color: `var(--${c.accent})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <HennaIcon name={c.icon} size={16} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <div style={{ fontFamily: 'var(--ui)', fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>{c.name}</div>
                    <div style={{ flex: 1 }} />
                    <div style={{ fontFamily: 'var(--serif)', fontSize: 14, color: 'var(--ink)' }}>{fmt(c.val)}</div>
                    <div style={{ fontFamily: 'var(--ui)', fontSize: 11, color: 'var(--muted)', width: 36, textAlign: 'right' }}>{c.pct}%</div>
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <HennaProgress value={c.pct} max={31} accent={c.accent} height={4} />
                  </div>
                </div>
              </div>
            ))}
          </HennaCard>
        </div>

        {/* Insight card */}
        <div style={{ padding: '16px 16px 0' }}>
          <HennaCard bg="var(--bronze-bg)" accent="var(--bronze)">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 18,
                background: 'rgba(255,255,255,0.7)', color: 'var(--bronze)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <HennaIcon name="sparkle" size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <div className="eyebrow" style={{ color: 'var(--bronze)' }}>Pattern noticed</div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 15, color: 'var(--ink)', marginTop: 4, lineHeight: 1.3 }}>
                  Saturdays are your biggest spending days · avg Rs 3,200
                </div>
              </div>
            </div>
          </HennaCard>
        </div>
      </div>
    </div>
  );
};

window.InsightsScreen = InsightsScreen;
