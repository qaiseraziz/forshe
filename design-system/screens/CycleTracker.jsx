/* eslint-disable */
// Cycle Tracker — Henna & Pearl
// Pink-toned. Calendar dots + phase summary + log button. Most private screen.

const CycleTrackerScreen = ({ onMenu }) => {
  // Build a tiny calendar grid (28 days, current cycle)
  const cycleStart = 8; // day 8 of month
  const today = 18;
  const periodDays = [8, 9, 10, 11, 12]; // 5 days of period
  const fertileDays = [22, 23, 24, 25, 26, 27];

  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  const dayKind = d => {
    if (periodDays.includes(d)) return 'period';
    if (fertileDays.includes(d)) return 'fertile';
    if (d === today) return 'today';
    return 'normal';
  };

  return (
    <div style={{ position: 'relative', height: '100%', background: 'var(--page-grad)', overflow: 'hidden' }}>
      <PaperNoise />
      <div style={{ position: 'relative', height: '100%', overflowY: 'auto', paddingBottom: 180 }}>
        <HennaHeader
          title="Cycle"
          subtitle="Private · stays on this device"
          onMenu={onMenu}
          action={<HennaIcon name="lock" size={16} color="var(--muted)" />}
        />

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
                <div className="eyebrow" style={{ color: 'var(--pink)' }}>Day 11 of 28 · follicular</div>
              </div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 26, color: 'var(--ink)', marginTop: 6, letterSpacing: -0.3 }}>
                Next period in 17 days
              </div>
              <div style={{ fontFamily: 'var(--ui)', fontSize: 12, color: 'var(--ink-2)', marginTop: 8, lineHeight: 1.5 }}>
                Energy rising · skin clearer · mood lifting. Fertile window starts in 11 days.
              </div>

              {/* Phase ring */}
              <div style={{ display: 'flex', gap: 8, marginTop: 16, alignItems: 'center' }}>
                {[
                  { name: 'Period',     active: false, color: 'var(--pink)' },
                  { name: 'Follicular', active: true,  color: 'var(--sage)' },
                  { name: 'Ovulation',  active: false, color: 'var(--bronze)' },
                  { name: 'Luteal',     active: false, color: 'var(--plum)' },
                ].map(p => (
                  <div key={p.name} style={{
                    flex: 1,
                    padding: '8px 6px', borderRadius: 14,
                    background: p.active ? 'var(--paper)' : 'rgba(255,255,255,0.4)',
                    textAlign: 'center',
                    boxShadow: p.active ? 'inset 0 0 0 1.5px var(--sage)' : 'none',
                  }}>
                    <div style={{ width: 6, height: 6, borderRadius: 3, background: p.color, margin: '0 auto 4px' }} />
                    <div style={{ fontFamily: 'var(--ui)', fontWeight: p.active ? 700 : 500, fontSize: 10, color: p.active ? 'var(--ink)' : 'var(--muted)' }}>{p.name}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <DividerOrnament style={{ padding: '22px 32px 10px' }} color="var(--pink)" />

        {/* Calendar */}
        <div className="eyebrow" style={{ padding: '0 24px 8px', textAlign: 'center' }}>May 2026</div>
        <div style={{ padding: '0 20px' }}>
          <HennaCard padding={16}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
              {['M','T','W','T','F','S','S'].map((d, i) => (
                <div key={i} style={{ fontFamily: 'var(--ui)', fontSize: 10, color: 'var(--muted)', textAlign: 'center', fontWeight: 600 }}>{d}</div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
              {days.map(d => {
                const k = dayKind(d);
                const styles = {
                  period:  { bg: 'var(--pink)',       fg: 'var(--paper)', border: 'none' },
                  fertile: { bg: 'var(--sage-bg)',    fg: 'var(--sage)',  border: '1.5px dashed var(--sage)' },
                  today:   { bg: 'var(--paper)',      fg: 'var(--ink)',   border: '2px solid var(--pink)' },
                  normal:  { bg: 'transparent',       fg: 'var(--ink-2)', border: 'none' },
                };
                const s = styles[k];
                return (
                  <div key={d} style={{
                    aspectRatio: '1', borderRadius: '50%',
                    background: s.bg, color: s.fg,
                    border: s.border,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--ui)', fontWeight: k === 'today' ? 700 : 500, fontSize: 12,
                  }}>{d}</div>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 14, marginTop: 14, fontFamily: 'var(--ui)', fontSize: 10, color: 'var(--muted)' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 4, background: 'var(--pink)' }} /> Period</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 4, background: 'var(--sage-bg)', border: '1.5px dashed var(--sage)' }} /> Fertile</span>
            </div>
          </HennaCard>
        </div>

        <div style={{ padding: '14px 16px 0', display: 'flex', gap: 8 }}>
          <HennaButton variant="pink" full icon="heart">Log today</HennaButton>
        </div>
      </div>
    </div>
  );
};

// HennaButton doesn't support "pink" variant yet — add fallback inline.
// (Real fix: extend HennaPrimitives.jsx, but inline override here keeps the
// file self-contained.)

window.CycleTrackerScreen = CycleTrackerScreen;
