/* eslint-disable */
// Settings — Henna & Pearl
// Sectioned list (Account, Privacy & Security, Preferences, About). Each row
// is a label + value or label + toggle.

const SettingsScreen = ({ onMenu }) => {
  const [notif, setNotif] = React.useState(true);
  const [biometric, setBiometric] = React.useState(true);
  const [haptics, setHaptics] = React.useState(true);
  const [darkMode, setDarkMode] = React.useState(false);

  const Toggle = ({ on, onClick }) => (
    <div role="switch" aria-checked={on} onClick={(e) => { e.stopPropagation(); onClick && onClick(); }} style={{
      width: 44, height: 26, borderRadius: 13,
      background: on ? 'var(--henna)' : 'rgba(147,73,57,0.20)',
      cursor: 'pointer', position: 'relative',
      transition: 'background 0.2s',
      flexShrink: 0,
    }}>
      <div style={{
        position: 'absolute',
        top: 3, left: on ? 21 : 3,
        width: 20, height: 20, borderRadius: 10,
        background: 'var(--paper)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        transition: 'left 0.2s',
      }} />
    </div>
  );

  const Section = ({ title, children }) => (
    <div style={{ padding: '14px 16px 0' }}>
      <div className="eyebrow" style={{ padding: '0 6px 8px' }}>{title}</div>
      <HennaCard padding={0}>{children}</HennaCard>
    </div>
  );

  const Row = ({ icon, label, value, onClick, toggle, accent = 'henna', last, danger }) => (
    <button onClick={onClick} style={{
      width: '100%', background: 'transparent', border: 0, cursor: onClick ? 'pointer' : 'default',
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '13px 18px', textAlign: 'left',
      borderBottom: last ? 'none' : '1px solid var(--line)',
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 16,
        background: danger ? 'var(--henna-bg)' : `var(--${accent}-bg)`,
        color: danger ? 'var(--henna)' : `var(--${accent})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <HennaIcon name={icon} size={15} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'var(--ui)', fontWeight: 500, fontSize: 14,
          color: danger ? 'var(--henna)' : 'var(--ink)',
        }}>{label}</div>
      </div>
      {toggle !== undefined ? <Toggle on={toggle.on} onClick={toggle.onChange} />
        : value !== undefined ? <div style={{ fontFamily: 'var(--ui)', fontSize: 13, color: 'var(--muted)' }}>{value}</div>
        : null}
      {!toggle && onClick && <HennaIcon name="chev-right" size={14} color="var(--muted)" />}
    </button>
  );

  return (
    <div style={{ position: 'relative', height: '100%', background: 'var(--page-grad)', overflow: 'hidden' }}>
      <PaperNoise />
      <div style={{ position: 'relative', height: '100%', overflowY: 'auto', paddingBottom: 180 }}>
        <HennaHeader title="Settings" subtitle="Personalise ForSHE" onMenu={onMenu} />

        {/* Account */}
        <div style={{ padding: '0 16px' }}>
          <HennaCard padding={20}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 56, height: 56, borderRadius: 28,
                background: 'linear-gradient(135deg, #B86553, #934939)',
                color: 'var(--paper)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--serif)', fontWeight: 700, fontSize: 24,
                boxShadow: '0 4px 12px rgba(147,73,57,0.25)',
              }}>H</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 18, color: 'var(--ink)' }}>Hina Iqbal</div>
                <div style={{ fontFamily: 'var(--ui)', fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>hina@gmail.com · Karachi</div>
              </div>
              <HennaIcon name="pencil" size={16} color="var(--muted)" />
            </div>
          </HennaCard>
        </div>

        <Section title="Privacy & Security">
          <Row icon="lock"   label="App Lock"               toggle={{ on: biometric, onChange: () => setBiometric(p => !p) }} accent="plum" />
          <Row icon="lock"   label="Biometric unlock"       value="Fingerprint" onClick={() => {}} accent="plum" />
          <Row icon="lock"   label="Change PIN"             onClick={() => {}} accent="plum" last />
        </Section>

        <Section title="Notifications">
          <Row icon="bell"   label="Daily reminders"        toggle={{ on: notif, onChange: () => setNotif(p => !p) }} accent="bronze" />
          <Row icon="bell"   label="Prayer time alerts"     value="5 prayers" onClick={() => {}} accent="bronze" />
          <Row icon="bell"   label="Low-stock alerts"       value="On" onClick={() => {}} accent="bronze" last />
        </Section>

        <Section title="Preferences">
          <Row icon="money"  label="Currency"               value="PKR (Rs)" onClick={() => {}} accent="henna" />
          <Row icon="calendar" label="Week starts"          value="Monday" onClick={() => {}} accent="henna" />
          <Row icon="prayer" label="Prayer school"          value="Hanafi" onClick={() => {}} accent="henna" />
          <Row icon="moon"   label="Dark mode"              toggle={{ on: darkMode, onChange: () => setDarkMode(p => !p) }} accent="henna" />
          <Row icon="sparkle" label="Haptics"               toggle={{ on: haptics, onChange: () => setHaptics(p => !p) }} accent="henna" last />
        </Section>

        <Section title="Data">
          <Row icon="lock"   label="Backup & Restore"       onClick={() => {}} accent="sage" />
          <Row icon="share"  label="Export to CSV"          onClick={() => {}} accent="sage" />
          <Row icon="trash"  label="Clear all data"         onClick={() => {}} danger last />
        </Section>

        <Section title="About">
          <Row icon="sparkle" label="ForSHE"                value="v1.2.17" />
          <Row icon="message" label="Send feedback"         onClick={() => {}} accent="plum" />
          <Row icon="star"    label="Rate the app"          onClick={() => {}} accent="bronze" last />
        </Section>
      </div>
    </div>
  );
};

window.SettingsScreen = SettingsScreen;
