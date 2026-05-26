/* eslint-disable */
// Maid Tasks — Henna & Pearl
// Daily checklist for household help. Sage-tinted hero, day strip, task rows
// with done state.

const MaidTasksScreen = ({ onMenu }) => {
  const [done, setDone] = React.useState({ 1: true, 3: true });
  const [day, setDay] = React.useState('Tue');
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const tasks = [
    { id: 1, name: 'Sweep + mop all rooms',     time: '8:00 AM' },
    { id: 2, name: 'Dust shelves + tables',     time: '9:00 AM' },
    { id: 3, name: 'Wash breakfast dishes',     time: '9:30 AM' },
    { id: 4, name: 'Laundry (whites)',          time: '10:30 AM' },
    { id: 5, name: 'Iron Ali\'s school uniform', time: '11:00 AM' },
    { id: 6, name: 'Prep vegetables for lunch', time: '11:30 AM' },
    { id: 7, name: 'Wash lunch dishes',         time: '2:30 PM' },
  ];
  const doneCount = Object.values(done).filter(Boolean).length;

  return (
    <div style={{ position: 'relative', height: '100%', background: 'var(--page-grad)', overflow: 'hidden' }}>
      <PaperNoise />
      <div style={{ position: 'relative', height: '100%', overflowY: 'auto', paddingBottom: 180 }}>
        <HennaHeader title="Maid Tasks" subtitle="Saima · 6 days a week" onMenu={onMenu} />

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
                <div className="eyebrow" style={{ color: 'var(--sage)' }}>Today</div>
              </div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 24, color: 'var(--ink)', marginTop: 6, letterSpacing: -0.3 }}>
                {doneCount} of {tasks.length} done
              </div>
              <div style={{ marginTop: 12 }}>
                <HennaProgress value={doneCount} max={tasks.length} accent="sage" height={6} />
              </div>
              <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
                <HennaButton variant="sage" size="sm" icon="check">Mark all done</HennaButton>
                <HennaButton variant="outline" size="sm" icon="message">Note to Saima</HennaButton>
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: '20px 16px 12px', display: 'flex', gap: 6, justifyContent: 'space-between' }}>
          {days.map(d => {
            const isActive = d === day;
            return (
              <button key={d} onClick={() => setDay(d)} style={{
                flex: 1, padding: '10px 0', borderRadius: 16,
                background: isActive ? 'var(--sage)' : 'var(--paper)',
                color: isActive ? 'var(--paper)' : 'var(--ink-2)',
                border: 0, cursor: 'pointer',
                boxShadow: isActive ? '0 4px 12px rgba(126,156,112,0.25)' : 'inset 0 0 0 1px var(--line)',
                fontFamily: 'var(--ui)', fontSize: 11, fontWeight: 600,
              }}>{d}</button>
            );
          })}
        </div>

        <div style={{ padding: '0 16px' }}>
          <HennaCard padding={0}>
            {tasks.map((t, i) => {
              const isDone = !!done[t.id];
              return (
                <button key={t.id} onClick={() => setDone(p => ({ ...p, [t.id]: !p[t.id] }))} style={{
                  width: '100%', background: 'transparent', border: 0, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '14px 18px', textAlign: 'left',
                  borderBottom: i < tasks.length - 1 ? '1px solid var(--line)' : 'none',
                }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: 12,
                    background: isDone ? 'var(--sage)' : 'transparent',
                    border: isDone ? 'none' : '1.5px solid var(--line-strong)',
                    color: 'var(--paper)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    {isDone && <HennaIcon name="check" size={14} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: 'var(--ui)', fontSize: 14, fontWeight: 500,
                      color: isDone ? 'var(--soft)' : 'var(--ink)',
                      textDecoration: isDone ? 'line-through' : 'none',
                      textDecorationColor: 'var(--soft)',
                    }}>{t.name}</div>
                    <div style={{ fontFamily: 'var(--ui)', fontSize: 11, color: 'var(--muted)', marginTop: 2, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <HennaIcon name="clock" size={10} /> {t.time}
                    </div>
                  </div>
                </button>
              );
            })}
          </HennaCard>
        </div>
      </div>
    </div>
  );
};

window.MaidTasksScreen = MaidTasksScreen;
