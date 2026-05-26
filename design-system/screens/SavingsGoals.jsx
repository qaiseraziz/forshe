/* eslint-disable */
// Savings Goals — Henna & Pearl
// Progress-driven goal cards. Hero with monthly contribution, then a list of
// goals with their own colored progress bars.

const SavingsGoalsScreen = ({ onMenu }) => {
  const goals = [
    { id: 1, name: 'Eid Shopping',      saved: 12000,  target: 25000, deadline: '18 days',  accent: 'henna',  icon: 'sparkle' },
    { id: 2, name: 'Karachi Trip',      saved: 35000,  target: 80000, deadline: '3 months', accent: 'sage',   icon: 'sun' },
    { id: 3, name: 'New Refrigerator',  saved: 60000,  target: 60000, deadline: 'achieved', accent: 'bronze', icon: 'snow' },
    { id: 4, name: "Hajj Fund",         saved: 145000, target: 600000,deadline: '2027',     accent: 'plum',   icon: 'mosque' },
  ];
  const fmt = n => 'Rs ' + n.toLocaleString('en-PK');
  const totalSaved = goals.reduce((s,g) => s + g.saved, 0);

  return (
    <div style={{ position: 'relative', height: '100%', background: 'var(--page-grad)', overflow: 'hidden' }}>
      <PaperNoise />
      <div style={{ position: 'relative', height: '100%', overflowY: 'auto', paddingBottom: 180 }}>
        <HennaHeader title="Savings Goals" subtitle={`${goals.length} active · ${fmt(totalSaved)} saved`} onMenu={onMenu} />

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
                Rs 47,<span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontWeight: 600, color: 'var(--henna)' }}>000</span>
              </div>
              <div style={{ fontFamily: 'var(--ui)', fontSize: 12, color: 'var(--ink-2)', marginTop: 6 }}>
                across 4 goals · keep going
              </div>
              <div style={{ marginTop: 14 }}>
                <HennaButton variant="primary" size="sm" icon="plus">New goal</HennaButton>
              </div>
            </div>
          </div>
        </div>

        <DividerOrnament style={{ padding: '22px 32px 10px' }} color="var(--henna)" />

        <div style={{ padding: '0 16px' }}>
          {goals.map(g => {
            const pct = Math.round((g.saved / g.target) * 100);
            const done = pct >= 100;
            return (
              <HennaCard key={g.id} style={{ marginBottom: 12 }} accent={`var(--${g.accent})`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 20,
                    background: `var(--${g.accent}-bg)`, color: `var(--${g.accent})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <HennaIcon name={g.icon} size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'var(--serif)', fontSize: 17, color: 'var(--ink)' }}>{g.name}</div>
                    <div style={{ fontFamily: 'var(--ui)', fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                      {fmt(g.saved)} of {fmt(g.target)} · {g.deadline}
                    </div>
                  </div>
                  {done
                    ? <HennaBadge accent="sage">achieved</HennaBadge>
                    : <div style={{ fontFamily: 'var(--serif)', fontSize: 18, color: `var(--${g.accent})` }}>{pct}%</div>}
                </div>
                <HennaProgress value={g.saved} max={g.target} accent={g.accent} />
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <HennaButton variant={done ? 'sage' : g.accent === 'sage' ? 'sage' : 'primary'} size="sm" icon="plus" style={{ flex: 1 }}>
                    Add contribution
                  </HennaButton>
                  <HennaButton variant="outline" size="sm" icon="pencil">Edit</HennaButton>
                </div>
              </HennaCard>
            );
          })}
        </div>
      </div>
    </div>
  );
};

window.SavingsGoalsScreen = SavingsGoalsScreen;
