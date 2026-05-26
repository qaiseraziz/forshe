/* eslint-disable */
// Backup & Restore — Henna & Pearl
// Encrypted-backup screen. Sage-tinted (trust). Status pill, options grid,
// restore flow trigger.

const BackupScreen = ({ onMenu }) => (
  <div style={{ position: 'relative', height: '100%', background: 'var(--page-grad)', overflow: 'hidden' }}>
    <PaperNoise />
    <div style={{ position: 'relative', height: '100%', overflowY: 'auto', paddingBottom: 180 }}>
      <HennaHeader title="Backup & Restore" subtitle="End-to-end encrypted" onMenu={onMenu} action={<HennaIcon name="lock" size={16} color="var(--muted)" />} />

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
              <div className="eyebrow" style={{ color: 'var(--sage)' }}>All caught up</div>
            </div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 24, color: 'var(--ink)', marginTop: 6, letterSpacing: -0.3 }}>
              Last backed up 2 hours ago
            </div>
            <div style={{ fontFamily: 'var(--ui)', fontSize: 12, color: 'var(--ink-2)', marginTop: 6 }}>
              412 transactions · 18 vendors · 24 reminders · 6 goals
            </div>
            <div style={{ marginTop: 14, padding: '10px 12px', background: 'rgba(255,255,255,0.6)', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
              <HennaIcon name="lock" size={16} color="var(--sage)" />
              <div style={{ flex: 1, fontFamily: 'var(--ui)', fontSize: 11, color: 'var(--ink-2)' }}>
                <strong style={{ color: 'var(--ink)' }}>AES-256 encrypted</strong> · only you can decrypt
              </div>
            </div>
            <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
              <HennaButton variant="sage" size="sm" icon="lock">Back up now</HennaButton>
              <HennaButton variant="outline" size="sm" icon="share">Export file</HennaButton>
            </div>
          </div>
        </div>
      </div>

      <DividerOrnament style={{ padding: '22px 32px 10px' }} color="var(--sage)" />

      <div className="eyebrow" style={{ padding: '0 24px 12px', textAlign: 'center' }}>Backup destination</div>
      <div style={{ padding: '0 16px' }}>
        <HennaCard padding={0}>
          {[
            { name: 'Local file',    sub: 'Save to phone storage',     icon: 'box',   active: true,  accent: 'sage' },
            { name: 'Google Drive',  sub: 'hina@gmail.com',            icon: 'share', active: true,  accent: 'plum' },
            { name: 'iCloud Drive',  sub: 'Not connected',             icon: 'share', active: false, accent: 'dust' },
            { name: 'Email backup',  sub: 'Send encrypted ZIP',        icon: 'message',active: false,accent: 'bronze' },
          ].map((d, i, a) => (
            <div key={d.name} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '14px 18px',
              borderBottom: i < a.length - 1 ? '1px solid var(--line)' : 'none',
              opacity: d.active ? 1 : 0.65,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 16,
                background: `var(--${d.accent}-bg)`, color: `var(--${d.accent})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <HennaIcon name={d.icon} size={15} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--ui)', fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>{d.name}</div>
                <div style={{ fontFamily: 'var(--ui)', fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{d.sub}</div>
              </div>
              {d.active
                ? <HennaBadge accent="sage">on</HennaBadge>
                : <HennaButton variant="outline" size="sm">Connect</HennaButton>}
            </div>
          ))}
        </HennaCard>
      </div>

      <div style={{ padding: '18px 16px 0' }}>
        <HennaCard bg="var(--henna-bg)" accent="var(--henna)" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <HennaIcon name="lock" size={20} color="var(--henna)" />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--ui)', fontWeight: 600, fontSize: 13, color: 'var(--ink)' }}>Restore from backup</div>
            <div style={{ fontFamily: 'var(--ui)', fontSize: 11, color: 'var(--ink-2)', marginTop: 2 }}>Switching device? Pull in your last backup.</div>
          </div>
          <HennaIcon name="chev-right" size={14} color="var(--muted)" />
        </HennaCard>
      </div>
    </div>
  </div>
);

window.BackupScreen = BackupScreen;
