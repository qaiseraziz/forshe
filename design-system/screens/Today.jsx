/* eslint-disable */
// Today — Henna & Pearl
// Home dashboard. Greeting hero, balance, six group cards, due-soon ribbon.

const TodayScreen = ({ onMenu, onNavigate, onQuickAdd, hour = 9 }) => {
  const [mealsOpen, setMealsOpen] = React.useState(false);
  const greeting = hour < 12 ? 'Salaam, Hina' : hour < 17 ? 'Good afternoon, Hina' : 'Good evening, Hina';
  const groups = [
    { name: 'Money',     stat: 'Rs 40,150', status: 'on track',  bg: 'var(--henna-bg)', accent: 'var(--henna)',  icon: 'money',  to: 'Expenses' },
    { name: 'Kitchen',   stat: '2 low',     status: 'restock',   bg: 'var(--bronze-bg)',accent: 'var(--bronze)', icon: 'pot',    to: 'Cooking' },
    { name: 'Household', stat: '1 today',   status: 'reminder',  bg: 'var(--plum-bg)',  accent: 'var(--plum)',   icon: 'house',  to: 'Reminders' },
    { name: 'Personal',  stat: '—',         status: 'rest day',  bg: 'var(--pink-bg)',  accent: 'var(--pink)',   icon: 'heart',  to: 'Cycle Tracker' },
    { name: 'Spiritual', stat: '3:42p',     status: 'next: Asr', bg: 'var(--sage-bg)',  accent: 'var(--sage)',   icon: 'mosque', to: 'Prayer Times' },
    { name: 'System',    stat: '',          status: 'all safe',  bg: 'var(--dust-bg)',  accent: 'var(--dust)',   icon: 'gear',   to: 'Settings' },
  ];

  return (
    <div style={{ position: 'relative', height: '100%', background: 'var(--page-grad)', overflow: 'hidden' }}>
      <PaperNoise />
      <div style={{ position: 'relative', height: '100%', overflowY: 'auto', paddingBottom: 180 }}>
        <HennaHeader
          title="ForSHE"
          subtitle="Tue · 26 May"
          onMenu={onMenu}
          action={<div style={{ fontFamily: 'var(--ui)', fontSize: 11, color: 'var(--muted)' }}>9:30 AM</div>}
        />

        {/* Hero card — greeting + balance */}
        <div style={{ padding: '0 16px' }}>
          <div style={{
            background: 'linear-gradient(160deg, #FBE7DD 0%, #F2D9CB 100%)',
            borderRadius: 28,
            padding: '22px 24px',
            boxShadow: '0 10px 30px rgba(147,73,57,0.10), inset 0 0 0 1px rgba(255,255,255,0.5)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <MeshOverlay />
            <div style={{ position: 'absolute', top: -6, right: -6 }}>
              <ArabesqueCorner size={110} color="#934939" opacity={0.14} />
            </div>
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MarginMark color="var(--henna)" />
                <div style={{ fontFamily: 'var(--ui)', fontWeight: 600, fontSize: 12, color: 'var(--henna)' }}>{greeting}</div>
              </div>
              <div className="display-num" style={{ marginTop: 8 }}>
                Rs 40,<span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontWeight: 600, color: 'var(--henna)' }}>150</span>
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 12, alignItems: 'baseline' }}>
                <div>
                  <div className="eyebrow">Spent today</div>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: 18, marginTop: 2 }}>Rs 600</div>
                </div>
                <div style={{ width: 1, height: 28, background: 'rgba(147,73,57,0.18)' }} />
                <div>
                  <div className="eyebrow">Budget</div>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: 18, marginTop: 2 }}>76%</div>
                </div>
                <HennaButton size="sm" icon="plus" onClick={onQuickAdd} style={{ marginLeft: 'auto' }}>Log</HennaButton>
              </div>
              <div style={{ marginTop: 14, height: 1, background: 'rgba(147,73,57,0.15)' }} />
              <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <HennaIcon name="bell" size={14} color="var(--henna)" />
                <div style={{ fontFamily: 'var(--ui)', fontSize: 12, color: 'var(--ink-2)', flex: 1 }}>
                  <strong style={{ color: 'var(--ink)' }}>Electricity bill</strong> · due at 6 PM
                </div>
                <HennaIcon name="chev-right" size={14} color="var(--muted)" />
              </div>
            </div>
          </div>
        </div>

        {/* Group grid */}
        <DividerOrnament style={{ padding: '22px 32px 10px' }} color="var(--henna)" />
        <div className="eyebrow" style={{ padding: '0 24px 12px', textAlign: 'center' }}>Your home today</div>
        <div style={{ padding: '0 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {groups.map(g => (
            <button key={g.name} onClick={() => onNavigate && onNavigate(g.to)} style={{
              background: g.bg,
              border: 0, cursor: 'pointer',
              borderRadius: 24, padding: '14px',
              boxShadow: '0 4px 12px rgba(60,40,20,0.06), inset 0 0 0 1px rgba(255,255,255,0.4)',
              height: 96, position: 'relative',
              textAlign: 'left',
            }}>
              <div style={{
                position: 'absolute', top: 12, right: 12,
                width: 28, height: 28, borderRadius: 14,
                background: 'rgba(255,255,255,0.7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: g.accent,
                boxShadow: 'inset 0 0 0 1px ' + g.accent + '22',
              }}>
                <HennaIcon name={g.icon} size={16} />
              </div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 17, color: 'var(--ink)' }}>{g.name}</div>
              <div style={{ fontFamily: 'var(--ui)', fontWeight: 600, fontSize: 13, color: g.accent, marginTop: 4 }}>{g.stat || ' '}</div>
              <div style={{ fontFamily: 'var(--ui)', fontSize: 10, color: 'var(--muted)', marginTop: 1 }}>{g.status}</div>
            </button>
          ))}
        </div>

        {/* Today's meals — collapsible */}
        <div style={{ padding: '20px 16px 0' }}>
          <button onClick={() => setMealsOpen(o => !o)} style={{
            width: '100%', background: 'var(--paper)', border: 0, cursor: 'pointer',
            borderRadius: 22, padding: '14px 18px',
            boxShadow: '0 4px 12px rgba(60,40,20,0.06), inset 0 0 0 1px var(--line)',
            display: 'flex', alignItems: 'center', gap: 12,
            textAlign: 'left',
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: 17,
              background: 'var(--bronze-bg)', color: 'var(--bronze)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <HennaIcon name="pot" size={17} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="eyebrow">Today's meals · 3 planned</div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 15, color: 'var(--ink)', marginTop: 2,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {mealsOpen ? 'Tap to collapse' : 'Karahi · Daal Chawal · Paratha'}
              </div>
            </div>
            <HennaIcon name={mealsOpen ? 'chev-down' : 'chev-right'} size={14} color="var(--muted)" />
          </button>

          {mealsOpen && (
            <HennaCard padding={0} style={{ marginTop: 8 }}>
              {[
                { meal: 'Breakfast', dish: 'Aloo Paratha + Chai',           icon: 'sun',  accent: 'bronze' },
                { meal: 'Lunch',     dish: 'Chicken Karahi · Salad · Naan', icon: 'pot',  accent: 'henna' },
                { meal: 'Dinner',    dish: 'Daal Chawal',                   icon: 'moon', accent: 'plum' },
              ].map((m, i, a) => (
                <div key={m.meal} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '14px 18px',
                  borderBottom: i < a.length - 1 ? '1px solid var(--line)' : 'none',
                }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: 15,
                    background: `var(--${m.accent}-bg)`, color: `var(--${m.accent})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <HennaIcon name={m.icon} size={16} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="eyebrow">{m.meal}</div>
                    <div style={{ fontFamily: 'var(--serif)', fontSize: 14, color: 'var(--ink)', marginTop: 2 }}>{m.dish}</div>
                  </div>
                  <HennaIcon name="chev-right" size={14} color="var(--muted)" />
                </div>
              ))}
            </HennaCard>
          )}
        </div>
      </div>
    </div>
  );
};

window.TodayScreen = TodayScreen;
