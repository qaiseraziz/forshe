/* eslint-disable */
// Fasting Calendar — Henna & Pearl
// Sunnah fasting tracker (Mondays, Thursdays, Ayyam al-Bid). Calendar grid +
// streak. Bronze/gold tinted.

const FastingScreen = ({ onMenu }) => {
  const today = 18;
  const fastedDays = [2, 5, 9, 12, 16];        // Past Mondays/Thursdays
  const recommendedToday = false;
  // White days (Ayyam al-Bid): 13, 14, 15 of Hijri month
  const whiteDays = [13, 14, 15];
  const days = Array.from({ length: 30 }, (_, i) => i + 1);

  return (
    <div style={{ position: 'relative', height: '100%', background: 'var(--page-grad)', overflow: 'hidden' }}>
      <PaperNoise />
      <div style={{ position: 'relative', height: '100%', overflowY: 'auto', paddingBottom: 180 }}>
        <HennaHeader
          title="Fasting"
          subtitle="Sunnah · Dhu al-Qadah 1447"
          onMenu={onMenu}
        />

        <div style={{ padding: '0 16px' }}>
          <div style={{
            background: 'linear-gradient(160deg, #EFE5D2 0%, #E2D4B2 100%)',
            borderRadius: 28, padding: '22px 24px',
            boxShadow: '0 10px 30px rgba(176,122,58,0.16), inset 0 0 0 1px rgba(255,255,255,0.5)',
            position: 'relative', overflow: 'hidden',
          }}>
            <MeshOverlay />
            <div style={{ position: 'absolute', top: -6, right: -6 }}>
              <ArabesqueCorner size={110} color="#B07A3A" opacity={0.18} />
            </div>
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MarginMark color="var(--bronze)" />
                <div className="eyebrow" style={{ color: 'var(--bronze)' }}>5 fasts this month</div>
              </div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 22, color: 'var(--ink)', marginTop: 6, letterSpacing: -0.3 }}>
                Next: white days, 13–15 Dhu al-Qadah
              </div>
              <div style={{ fontFamily: 'var(--ui)', fontSize: 12, color: 'var(--ink-2)', marginTop: 8 }}>
                Suhoor at <strong style={{ color: 'var(--ink)' }}>4:34 AM</strong> · Iftar at <strong style={{ color: 'var(--ink)' }}>6:58 PM</strong>
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <HennaButton variant="bronze" size="sm" icon="moon">Mark fast today</HennaButton>
                <HennaButton variant="outline" size="sm">Niyyah</HennaButton>
              </div>
            </div>
          </div>
        </div>

        <DividerOrnament style={{ padding: '22px 32px 10px' }} color="var(--bronze)" />

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
                const fasted = fastedDays.includes(d);
                const white = whiteDays.includes(d);
                const isToday = d === today;
                let bg = 'transparent', fg = 'var(--ink-2)', icon = null;
                if (fasted) { bg = 'var(--bronze)'; fg = 'var(--paper)'; icon = 'moon'; }
                else if (white) { bg = 'var(--bronze-bg)'; fg = 'var(--bronze)'; }
                if (isToday && !fasted) bg = 'var(--paper)', fg = 'var(--ink)';
                return (
                  <div key={d} style={{
                    aspectRatio: '1', borderRadius: '50%',
                    background: bg, color: fg,
                    border: isToday ? '2px solid var(--bronze)' : white ? '1.5px dashed var(--bronze)' : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
                    fontFamily: 'var(--ui)', fontWeight: isToday ? 700 : 500, fontSize: 12,
                  }}>
                    {d}
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 14, marginTop: 14, fontFamily: 'var(--ui)', fontSize: 10, color: 'var(--muted)' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 4, background: 'var(--bronze)' }} /> Fasted</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 4, background: 'var(--bronze-bg)', border: '1.5px dashed var(--bronze)' }} /> Sunnah</span>
            </div>
          </HennaCard>
        </div>

        {/* Streak */}
        <div style={{ padding: '14px 16px 0' }}>
          <HennaCard bg="var(--bronze-bg)" accent="var(--bronze)" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 24,
              background: 'rgba(255,255,255,0.7)', color: 'var(--bronze)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <HennaIcon name="flame" size={24} />
            </div>
            <div style={{ flex: 1 }}>
              <div className="eyebrow" style={{ color: 'var(--bronze)' }}>Consistency</div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 17, color: 'var(--ink)', marginTop: 2 }}>
                4 weeks of Monday + Thursday fasts
              </div>
            </div>
          </HennaCard>
        </div>
      </div>
    </div>
  );
};

window.FastingScreen = FastingScreen;
