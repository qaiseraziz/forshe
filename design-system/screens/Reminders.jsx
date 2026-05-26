/* eslint-disable */
// Reminders — Henna & Pearl
// List of upcoming reminders/bills. Filter pills (All / Bills / Medication /
// Other), then grouped by day with rich row content (amount, dosage, recurring).

const RemindersScreen = ({ onMenu, onQuickAdd }) => {
  const [filter, setFilter] = React.useState('All');
  const items = [
    { id: 1, title: 'Electricity Bill',  cat: 'Bills',      type: 'bill',      icon: 'electricity', amount: 4200, recurring: 'monthly', date: 'Today',     time: '6:00 PM', done: false },
    { id: 2, title: 'Vitamin D · 1 tab', cat: 'Medication', type: 'med',       icon: 'pill',        dosage: '1000 IU · with food',     date: 'Today',     time: '9:00 PM', done: false },
    { id: 3, title: 'Gas Bill',          cat: 'Bills',      type: 'bill',      icon: 'flame',       amount: 1850, recurring: 'monthly', date: 'Tomorrow',  time: '—',       done: false },
    { id: 4, title: "Hira's birthday",   cat: 'Family',     type: 'general',   icon: 'heart',       date: 'Fri 30 May', done: false },
    { id: 5, title: 'School fees · Ali', cat: 'Bills',      type: 'bill',      icon: 'book',        amount: 12500, recurring: 'monthly', date: 'Mon 02 Jun', done: false },
    { id: 6, title: 'Cardiology checkup',cat: 'Health',     type: 'general',   icon: 'doctor',      date: 'Thu 05 Jun', time: '11:30 AM', done: false },
  ];

  const filterMap = { All: () => true, Bills: i => i.type === 'bill', Medication: i => i.type === 'med', Other: i => i.type === 'general' };
  const shown = items.filter(filterMap[filter]);

  return (
    <div style={{ position: 'relative', height: '100%', background: 'var(--page-grad)', overflow: 'hidden' }}>
      <PaperNoise />
      <div style={{ position: 'relative', height: '100%', overflowY: 'auto', paddingBottom: 180 }}>
        <HennaHeader
          title="Reminders"
          subtitle={`${items.filter(i => !i.done).length} upcoming · 1 due today`}
          onMenu={onMenu}
        />

        {/* Hero */}
        <div style={{ padding: '0 16px' }}>
          <div style={{
            background: 'linear-gradient(160deg, #E2EAD8 0%, #CFD9C2 100%)',
            borderRadius: 28, padding: '20px 22px',
            boxShadow: '0 10px 30px rgba(126,156,112,0.16), inset 0 0 0 1px rgba(255,255,255,0.5)',
            position: 'relative', overflow: 'hidden',
          }}>
            <MeshOverlay />
            <div style={{ position: 'absolute', top: -6, right: -6 }}>
              <ArabesqueCorner size={100} color="#7E9C70" opacity={0.18} />
            </div>
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MarginMark color="var(--sage)" />
                <div className="eyebrow" style={{ color: 'var(--sage)' }}>Next up</div>
              </div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 22, color: 'var(--ink)', marginTop: 6 }}>
                Electricity bill, 6 PM
              </div>
              <div style={{ fontFamily: 'var(--ui)', fontSize: 12, color: 'var(--ink-2)', marginTop: 6 }}>
                Rs 4,200 · recurring monthly
              </div>
              <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
                <HennaButton variant="sage" size="sm" icon="check">Mark done</HennaButton>
                <HennaButton variant="outline" size="sm">Snooze 1 day</HennaButton>
              </div>
            </div>
          </div>
        </div>

        {/* Filter rail */}
        <div style={{ padding: '18px 16px 6px', overflowX: 'auto' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {['All', 'Bills', 'Medication', 'Other'].map(f => (
              <HennaPill key={f} active={filter === f} onClick={() => setFilter(f)} accent="henna">{f}</HennaPill>
            ))}
            <div style={{ flex: 1 }} />
            <HennaPill icon="plus" onClick={onQuickAdd}>New</HennaPill>
          </div>
        </div>

        {/* Reminder list grouped */}
        <div style={{ padding: '12px 16px' }}>
          {['Today', 'Tomorrow', 'Fri 30 May', 'Mon 02 Jun', 'Thu 05 Jun'].map(day => {
            const dayItems = shown.filter(i => i.date === day);
            if (!dayItems.length) return null;
            return (
              <div key={day} style={{ marginBottom: 10 }}>
                <div className="eyebrow" style={{ padding: '6px 6px 8px' }}>{day}</div>
                <HennaCard padding={0}>
                  {dayItems.map((r, i) => (
                    <div key={r.id} style={{
                      display: 'flex', alignItems: 'flex-start', gap: 12,
                      padding: '14px 18px',
                      borderBottom: i < dayItems.length - 1 ? '1px solid var(--line)' : 'none',
                    }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 18,
                        background: r.type === 'bill' ? 'var(--henna-bg)'
                                  : r.type === 'med'  ? 'var(--plum-bg)'
                                  : 'var(--bronze-bg)',
                        color: r.type === 'bill' ? 'var(--henna)'
                             : r.type === 'med'  ? 'var(--plum)'
                             : 'var(--bronze)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <HennaIcon name={r.icon} size={17} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                          <div style={{ fontFamily: 'var(--ui)', fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>{r.title}</div>
                          {r.amount && <div style={{ fontFamily: 'var(--serif)', fontSize: 14, color: 'var(--henna)' }}>Rs {r.amount.toLocaleString()}</div>}
                        </div>
                        <div style={{ fontFamily: 'var(--ui)', fontSize: 11, color: 'var(--muted)', marginTop: 3, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {r.time && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><HennaIcon name="clock" size={10} /> {r.time}</span>}
                          {r.recurring && <span>· {r.recurring}</span>}
                          {r.dosage && <span>{r.dosage}</span>}
                        </div>
                      </div>
                      <button aria-label="Mark done" style={{
                        width: 26, height: 26, borderRadius: 13,
                        background: 'transparent',
                        border: '1.5px solid var(--line-strong)',
                        cursor: 'pointer', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--muted)',
                      }} />
                    </div>
                  ))}
                </HennaCard>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

window.RemindersScreen = RemindersScreen;
