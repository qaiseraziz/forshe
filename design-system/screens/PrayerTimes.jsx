/* eslint-disable */
// Prayer Times — Henna & Pearl
// Plum-tinted. 5 daily prayers + qibla direction + city picker.

const PrayerTimesScreen = ({ onMenu }) => {
  const prayers = [
    { name: 'Fajr',    arabic: 'الفجر',  time: '4:42 AM',  passed: true,  icon: 'moon' },
    { name: 'Dhuhr',   arabic: 'الظهر',  time: '12:18 PM', passed: true,  icon: 'sun' },
    { name: 'Asr',     arabic: 'العصر',  time: '3:42 PM',  next: true,    icon: 'sun' },
    { name: 'Maghrib', arabic: 'المغرب', time: '6:58 PM',  passed: false, icon: 'moon' },
    { name: 'Isha',    arabic: 'العشاء', time: '8:21 PM',  passed: false, icon: 'moon' },
  ];
  const nextPrayer = prayers.find(p => p.next);

  return (
    <div style={{ position: 'relative', height: '100%', background: 'var(--page-grad)', overflow: 'hidden' }}>
      <PaperNoise />
      <div style={{ position: 'relative', height: '100%', overflowY: 'auto', paddingBottom: 180 }}>
        <HennaHeader
          title="Prayer Times"
          subtitle="Karachi · Hanafi"
          onMenu={onMenu}
          action={<HennaIcon name="gear" size={16} color="var(--muted)" />}
        />

        <div style={{ padding: '0 16px' }}>
          <div style={{
            background: 'linear-gradient(160deg, #E8E1F0 0%, #D5C8E6 100%)',
            borderRadius: 28, padding: '22px 24px',
            boxShadow: '0 10px 30px rgba(106,88,145,0.18), inset 0 0 0 1px rgba(255,255,255,0.5)',
            position: 'relative', overflow: 'hidden',
          }}>
            <MeshOverlay />
            <div style={{ position: 'absolute', top: -6, right: -6 }}>
              <ArabesqueCorner size={110} color="#6A5891" opacity={0.18} />
            </div>
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MarginMark color="var(--plum)" />
                <div className="eyebrow" style={{ color: 'var(--plum)' }}>Next prayer · in 1h 23m</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginTop: 6 }}>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 36, color: 'var(--ink)', letterSpacing: -0.5 }}>{nextPrayer.name}</div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 20, color: 'var(--plum)' }}>{nextPrayer.arabic}</div>
              </div>
              <div style={{ fontFamily: 'var(--ui)', fontSize: 14, color: 'var(--ink-2)', marginTop: 4 }}>
                <strong style={{ color: 'var(--ink)' }}>{nextPrayer.time}</strong>
              </div>

              <div style={{ marginTop: 16, padding: '14px 14px', background: 'rgba(255,255,255,0.6)', borderRadius: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
                {/* Qibla compass */}
                <div style={{ position: 'relative', width: 48, height: 48, borderRadius: 24, background: 'var(--plum-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="32" height="32" viewBox="0 0 32 32">
                    <circle cx="16" cy="16" r="14" fill="none" stroke="var(--plum)" strokeWidth="1" opacity="0.4" />
                    <path d="M 16 4 L 18 14 L 16 12 L 14 14 Z" fill="var(--plum)" transform="rotate(245 16 16)" />
                    <circle cx="16" cy="16" r="2" fill="var(--plum)" />
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div className="eyebrow" style={{ color: 'var(--plum)' }}>Qibla direction</div>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: 16, color: 'var(--ink)', marginTop: 2 }}>245° West</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DividerOrnament style={{ padding: '22px 32px 10px' }} color="var(--plum)" />

        <div className="eyebrow" style={{ padding: '0 24px 12px', textAlign: 'center' }}>Today's prayers</div>
        <div style={{ padding: '0 16px' }}>
          <HennaCard padding={0}>
            {prayers.map((p, i) => (
              <div key={p.name} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 18px',
                borderBottom: i < prayers.length - 1 ? '1px solid var(--line)' : 'none',
                background: p.next ? 'var(--plum-bg)' : 'transparent',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 18,
                  background: p.next ? 'var(--plum)' : 'var(--plum-bg)',
                  color: p.next ? 'var(--paper)' : 'var(--plum)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <HennaIcon name={p.icon} size={17} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <div style={{ fontFamily: 'var(--serif)', fontSize: 17, color: 'var(--ink)' }}>{p.name}</div>
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 13, color: 'var(--muted)' }}>{p.arabic}</div>
                  </div>
                  <div style={{ fontFamily: 'var(--ui)', fontSize: 11, color: p.passed ? 'var(--soft)' : 'var(--muted)', marginTop: 2 }}>
                    {p.passed ? 'completed' : p.next ? 'up next' : 'upcoming'}
                  </div>
                </div>
                <div style={{
                  fontFamily: 'var(--serif)', fontSize: 16,
                  color: p.passed ? 'var(--soft)' : p.next ? 'var(--plum)' : 'var(--ink)',
                  textDecoration: p.passed ? 'line-through' : 'none',
                  textDecorationColor: 'var(--soft)',
                }}>
                  {p.time}
                </div>
              </div>
            ))}
          </HennaCard>
        </div>
      </div>
    </div>
  );
};

window.PrayerTimesScreen = PrayerTimesScreen;
