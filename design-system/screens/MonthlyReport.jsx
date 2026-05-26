/* eslint-disable */
// Monthly Report — Henna & Pearl
// End-of-month summary. Big hero with net + savings rate, bar chart of last 6
// months, top categories, top vendors.

const MonthlyReportScreen = ({ onMenu }) => {
  const months = [
    { m: 'Dec', val: 38000 }, { m: 'Jan', val: 42000 }, { m: 'Feb', val: 39000 },
    { m: 'Mar', val: 45000 }, { m: 'Apr', val: 41000 }, { m: 'May', val: 26100 },
  ];
  const maxVal = Math.max(...months.map(d => d.val));
  const fmt = n => 'Rs ' + n.toLocaleString('en-PK');
  const tops = [
    { name: 'Food',      val: 8200,  pct: 31, accent: 'henna',  icon: 'pot' },
    { name: 'Bills',     val: 6050,  pct: 23, accent: 'plum',   icon: 'electricity' },
    { name: 'Transport', val: 4800,  pct: 18, accent: 'bronze', icon: 'car' },
  ];

  return (
    <div style={{ position: 'relative', height: '100%', background: 'var(--page-grad)', overflow: 'hidden' }}>
      <PaperNoise />
      <div style={{ position: 'relative', height: '100%', overflowY: 'auto', paddingBottom: 180 }}>
        <HennaHeader
          title="Monthly Report"
          subtitle="May 2026 · review"
          onMenu={onMenu}
          action={<HennaIcon name="share" size={16} color="var(--muted)" />}
        />

        <div style={{ padding: '0 16px' }}>
          <div style={{
            background: 'linear-gradient(160deg, #FBE7DD 0%, #F2D9CB 100%)',
            borderRadius: 28, padding: '22px 24px',
            boxShadow: '0 10px 30px rgba(147,73,57,0.10), inset 0 0 0 1px rgba(255,255,255,0.5)',
            position: 'relative', overflow: 'hidden',
          }}>
            <MeshOverlay />
            <div style={{ position: 'absolute', top: -6, right: -6 }}>
              <ArabesqueCorner size={110} color="#934939" opacity={0.14} />
            </div>
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MarginMark color="var(--henna)" />
                <div className="eyebrow" style={{ color: 'var(--henna)' }}>Saved this month</div>
              </div>
              <div className="display-num" style={{ marginTop: 8 }}>
                Rs 23,<span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontWeight: 600, color: 'var(--henna)' }}>900</span>
              </div>
              <div style={{ display: 'flex', gap: 14, marginTop: 12 }}>
                <div>
                  <div className="eyebrow">Received</div>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: 17, color: 'var(--sage)' }}>{fmt(50000)}</div>
                </div>
                <div style={{ width: 1, height: 32, background: 'rgba(147,73,57,0.18)' }} />
                <div>
                  <div className="eyebrow">Spent</div>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: 17, color: 'var(--henna)' }}>{fmt(26100)}</div>
                </div>
                <div style={{ width: 1, height: 32, background: 'rgba(147,73,57,0.18)' }} />
                <div>
                  <div className="eyebrow">Rate</div>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: 17, color: 'var(--sage)' }}>48%</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DividerOrnament style={{ padding: '22px 32px 10px' }} color="var(--henna)" />

        <div className="eyebrow" style={{ padding: '0 24px 12px', textAlign: 'center' }}>Last 6 months · spent</div>
        <div style={{ padding: '0 16px' }}>
          <HennaCard padding={20}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 100 }}>
              {months.map((d, i) => {
                const h = Math.round((d.val / maxVal) * 88);
                const current = i === months.length - 1;
                return (
                  <div key={d.m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <div style={{ fontFamily: 'var(--serif)', fontSize: 10, color: current ? 'var(--henna)' : 'var(--muted)' }}>{(d.val/1000).toFixed(0)}k</div>
                    <div style={{
                      width: '100%',
                      height: h,
                      borderRadius: 8,
                      background: current
                        ? 'linear-gradient(180deg, #B86553, #934939)'
                        : 'linear-gradient(180deg, rgba(147,73,57,0.25), rgba(147,73,57,0.45))',
                      boxShadow: current ? '0 4px 12px rgba(147,73,57,0.3)' : 'none',
                    }} />
                    <div style={{ fontFamily: 'var(--ui)', fontSize: 10, color: current ? 'var(--henna)' : 'var(--muted)', fontWeight: current ? 700 : 500 }}>{d.m}</div>
                  </div>
                );
              })}
            </div>
          </HennaCard>
        </div>

        <div className="eyebrow" style={{ padding: '18px 24px 12px', textAlign: 'center' }}>Top categories</div>
        <div style={{ padding: '0 16px' }}>
          <HennaCard padding={0}>
            {tops.map((c, i) => (
              <div key={c.name} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 18px',
                borderBottom: i < tops.length - 1 ? '1px solid var(--line)' : 'none',
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 16,
                  background: `var(--${c.accent}-bg)`, color: `var(--${c.accent})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <HennaIcon name={c.icon} size={16} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--ui)', fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>{c.name}</div>
                  <div style={{ marginTop: 4 }}><HennaProgress value={c.pct} max={31} accent={c.accent} height={4} /></div>
                </div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 15, color: 'var(--ink)' }}>{fmt(c.val)}</div>
              </div>
            ))}
          </HennaCard>
        </div>

        <div style={{ padding: '18px 16px 0' }}>
          <HennaCard bg="var(--sage-bg)" accent="var(--sage)" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <HennaIcon name="sparkle" size={20} color="var(--sage)" />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 15, color: 'var(--ink)' }}>Your best month yet</div>
              <div style={{ fontFamily: 'var(--ui)', fontSize: 12, color: 'var(--ink-2)', marginTop: 2 }}>48% savings rate · 4% above April</div>
            </div>
          </HennaCard>
        </div>
      </div>
    </div>
  );
};

window.MonthlyReportScreen = MonthlyReportScreen;
