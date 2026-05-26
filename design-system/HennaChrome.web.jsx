/* eslint-disable */
// Henna & Pearl — chrome (TabBar, FAB, Drawer, ScreenHeader)
// Reusable navigation + framing components shared across every screen.

// Screen header — sits at top of each screen, hosts hamburger + title + action
const HennaHeader = ({ title, subtitle, onMenu, action, large }) => (
  <div style={{ padding: '6px 20px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
    {onMenu && (
      <button onClick={onMenu} aria-label="Menu" style={{
        width: 40, height: 40, borderRadius: 14,
        background: 'var(--paper)',
        border: 0, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: 'inset 0 0 0 1px var(--line), 0 2px 6px rgba(147,73,57,0.06)',
        color: 'var(--ink)',
      }}>
        <HennaIcon name="menu" size={18} />
      </button>
    )}
    <div style={{ flex: 1 }}>
      <div style={{
        fontFamily: 'var(--serif)',
        fontSize: large ? 26 : 20,
        color: 'var(--ink)',
        letterSpacing: -0.3,
        lineHeight: 1.1,
      }}>{title}</div>
      {subtitle && <div style={{
        fontFamily: 'var(--ui)', fontSize: 12, color: 'var(--muted)', marginTop: 3,
      }}>{subtitle}</div>}
    </div>
    {action}
  </div>
);

// Bottom tab bar — pearl pill, 4 tabs, hand-drawn icons, henna active state
const HENNA_TABS = [
  { name: 'Today',    icon: 'home' },
  { name: 'Expenses', icon: 'wallet' },
  { name: 'Cooking',  icon: 'utensils' },
  { name: 'Remind',   icon: 'bell',     badge: 3 },
];

const HennaTabBar = ({ active, onChange, style }) => (
  <div style={{
    position: 'absolute', bottom: 14, left: 16, right: 16,
    background: 'var(--paper)',
    boxShadow: 'var(--shadow-md), inset 0 0 0 1px var(--line)',
    borderRadius: 'var(--r-tab)',
    padding: '10px 8px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4,
    ...style,
  }}>
    {HENNA_TABS.map(t => {
      const isActive = t.name === active;
      return (
        <button key={t.name} onClick={() => onChange && onChange(t.name)} style={{
          flex: 1, padding: '8px 6px',
          borderRadius: 22,
          background: isActive ? 'var(--henna)' : 'transparent',
          color: isActive ? 'var(--paper)' : 'var(--muted)',
          border: 0, cursor: 'pointer',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
          position: 'relative',
        }}>
          <HennaIcon name={t.icon} size={18} />
          <div style={{ fontFamily: 'var(--ui)', fontWeight: 600, fontSize: 9, letterSpacing: 0.3 }}>{t.name}</div>
          {t.badge && !isActive && (
            <div style={{
              position: 'absolute', top: 4, right: 14,
              background: 'var(--henna)', color: 'var(--paper)',
              borderRadius: 999, fontFamily: 'var(--ui)', fontWeight: 700, fontSize: 8,
              padding: '1px 5px', minWidth: 14, textAlign: 'center', lineHeight: '12px',
              border: '1.5px solid var(--paper)',
            }}>{t.badge}</div>
          )}
        </button>
      );
    })}
  </div>
);

// Floating Quick-Add button — henna gradient, sits above tab bar
const HennaFab = ({ onClick }) => (
  <button onClick={onClick} aria-label="Quick add" style={{
    position: 'absolute', right: 24, bottom: 90,
    width: 56, height: 56, borderRadius: 'var(--r-fab)',
    background: 'linear-gradient(135deg, #B86553 0%, #934939 100%)',
    boxShadow: '0 10px 24px rgba(147,73,57,0.42), inset 0 1px 0 rgba(255,255,255,0.18)',
    border: 0, cursor: 'pointer', color: 'var(--paper)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 50,
  }}>
    <HennaIcon name="plus" size={24} />
  </button>
);

// Drawer — slides from left, logo on top, six grouped sections, henna active
const HENNA_DRAWER = [
  { title: 'Money',     icon: 'money',  items: [
    { name: 'Expenses',      icon: 'wallet' },
    { name: 'Savings Goals', icon: 'goal' },
    { name: 'Insights',      icon: 'chart' },
    { name: 'Monthly Report',icon: 'report' },
  ]},
  { title: 'Kitchen',   icon: 'pot',    items: [
    { name: 'Cooking',       icon: 'utensils' },
    { name: 'Recipe Book',   icon: 'book' },
    { name: 'Shopping List', icon: 'cart' },
    { name: 'Inventory',     icon: 'box' },
  ]},
  { title: 'Household', icon: 'house',  items: [
    { name: 'Maid Tasks',    icon: 'broom' },
    { name: 'Reminders',     icon: 'bell' },
    { name: 'Vendors',       icon: 'phone' },
  ]},
  { title: 'Personal',  icon: 'heart',  items: [
    { name: 'Cycle Tracker', icon: 'cycle' },
    { name: 'Body Stats',    icon: 'body' },
  ]},
  { title: 'Spiritual', icon: 'mosque', items: [
    { name: 'Prayer Times',  icon: 'prayer' },
    { name: 'Fasting',       icon: 'moon' },
  ]},
  { title: 'System',    icon: 'gear',   items: [
    { name: 'Backup',        icon: 'lock' },
    { name: 'Settings',      icon: 'gear' },
  ]},
];

const HennaDrawer = ({ open, active, onClose, onNavigate }) => {
  if (!open) return null;
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 400, display: 'flex' }}>
      <div style={{
        width: 290,
        background: 'var(--pearl)',
        backgroundImage: 'var(--paper-noise)',
        backgroundSize: 'var(--paper-grain)',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 0 50px rgba(60,40,20,0.18)',
      }}>
        {/* Header */}
        <div style={{ padding: '24px 24px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 21,
              background: 'var(--paper)',
              boxShadow: 'inset 0 0 0 1px var(--line)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--henna)',
            }}>
              <HennaIcon name="sparkle" size={22} />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 22, color: 'var(--ink)' }}>ForSHE</div>
              <div style={{ fontFamily: 'var(--ui)', fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>Your home, your way</div>
            </div>
          </div>
        </div>

        {/* Today standalone */}
        <button onClick={() => { onNavigate('Today'); onClose(); }} style={{
          margin: '0 16px 8px',
          padding: '12px 14px', borderRadius: 16,
          background: active === 'Today' ? 'var(--henna-bg)' : 'transparent',
          color: active === 'Today' ? 'var(--henna)' : 'var(--ink-2)',
          border: 0, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 12,
          fontFamily: 'var(--ui)', fontWeight: 600, fontSize: 14,
        }}>
          <HennaIcon name="home" size={18} /> Today
        </button>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px' }}>
          {HENNA_DRAWER.map(group => (
            <div key={group.title} style={{ marginTop: 14 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '4px 14px 8px',
                color: 'var(--henna)',
              }}>
                <HennaIcon name={group.icon} size={14} />
                <div className="eyebrow" style={{ color: 'var(--henna)' }}>{group.title}</div>
              </div>
              {group.items.map(item => {
                const isActive = item.name === active;
                return (
                  <button key={item.name} onClick={() => { onNavigate(item.name); onClose(); }} style={{
                    width: '100%',
                    padding: '10px 14px', borderRadius: 14,
                    background: isActive ? 'var(--henna-bg)' : 'transparent',
                    color: isActive ? 'var(--henna)' : 'var(--ink-2)',
                    border: 0, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 12,
                    fontFamily: 'var(--ui)', fontWeight: 500, fontSize: 13,
                    textAlign: 'left',
                  }}>
                    <HennaIcon name={item.icon} size={16} />
                    <span style={{ flex: 1 }}>{item.name}</span>
                    {isActive && <div style={{ width: 4, height: 18, borderRadius: 2, background: 'var(--henna)' }} />}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div style={{
          padding: '14px 24px 20px',
          borderTop: '1px solid var(--line)',
          fontFamily: 'var(--ui)', fontSize: 11, color: 'var(--muted)',
        }}>ForSHE v1.2.17</div>
      </div>
      <div onClick={onClose} style={{ flex: 1, background: 'rgba(60,40,20,0.4)' }} />
    </div>
  );
};

// Quick Add bottom sheet — slides up from bottom
const HennaQuickAddSheet = ({ open, onClose, onSave }) => {
  if (!open) return null;
  const [mode, setMode] = React.useState('expense');
  const [label, setLabel] = React.useState('');
  const [amt, setAmt] = React.useState('');

  const QUICK_PRESETS = [
    { label: 'Vegetables',   icon: 'veg',         cat: '🍔 Food' },
    { label: 'Milk',         icon: 'milk',        cat: '🍔 Food' },
    { label: 'Bread',        icon: 'bread',       cat: '🍔 Food' },
    { label: 'Petrol',       icon: 'fuel',        cat: '🚗 Transport' },
    { label: 'Medicine',     icon: 'pill',        cat: '💊 Health' },
    { label: 'Electricity',  icon: 'electricity', cat: '💡 Bills' },
  ];

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 300, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(60,40,20,0.45)' }} />
      <div style={{
        position: 'relative',
        background: 'var(--pearl)',
        borderTopLeftRadius: 32, borderTopRightRadius: 32,
        padding: '20px 24px 40px',
        maxHeight: '85%',
        overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <div style={{ width: 44, height: 4, borderRadius: 2, background: 'var(--line-strong)' }} />
        </div>

        <div style={{ fontFamily: 'var(--serif)', fontSize: 22, color: 'var(--ink)', marginBottom: 4 }}>Quick Add</div>
        <div style={{ fontFamily: 'var(--ui)', fontSize: 12, color: 'var(--muted)', marginBottom: 18 }}>Log a transaction in PKR</div>

        {/* Toggle */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 18, background: 'var(--paper-2)', padding: 4, borderRadius: 999 }}>
          {[['topup','Received','sage'],['expense','Expense','henna']].map(([k,l,a]) => {
            const on = mode === k;
            return (
              <button key={k} onClick={() => setMode(k)} style={{
                flex: 1, padding: '10px 0', borderRadius: 999,
                background: on ? `var(--${a})` : 'transparent',
                color: on ? 'var(--paper)' : 'var(--muted)',
                border: 0, cursor: 'pointer',
                fontFamily: 'var(--ui)', fontWeight: 600, fontSize: 13,
              }}>{l}</button>
            );
          })}
        </div>

        {/* Quick presets */}
        <div className="eyebrow" style={{ marginBottom: 10 }}>Quick presets</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 18 }}>
          {QUICK_PRESETS.map(p => (
            <button key={p.label} onClick={() => { onSave({ mode: 'expense', label: p.label, amount: 200, cat: p.cat }); onClose(); }} style={{
              background: 'var(--paper)', border: 0, cursor: 'pointer',
              padding: '12px 10px', borderRadius: 18,
              boxShadow: 'inset 0 0 0 1px var(--line)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              color: 'var(--henna)',
            }}>
              <HennaIcon name={p.icon} size={20} />
              <div style={{ fontFamily: 'var(--ui)', fontWeight: 600, fontSize: 10, color: 'var(--ink-2)' }}>{p.label}</div>
            </button>
          ))}
        </div>

        <HennaInput label="Label" value={label} placeholder="What did you buy?" onChange={setLabel} style={{ marginBottom: 12 }} />
        <HennaInput label="Amount (PKR)" value={amt} placeholder="Amount" onChange={setAmt} icon="money" style={{ marginBottom: 18 }} />

        <div style={{ display: 'flex', gap: 10 }}>
          <HennaButton variant="outline" onClick={onClose} style={{ flex: 1 }}>Cancel</HennaButton>
          <HennaButton onClick={() => {
            const v = parseFloat(amt);
            if (!isNaN(v) && v > 0) onSave({ mode, label, amount: v, cat: '🛒 Other' });
            onClose();
          }} style={{ flex: 2 }}>+ Add {mode === 'expense' ? 'Expense' : 'Received'}</HennaButton>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, {
  HennaHeader, HennaTabBar, HennaFab, HennaDrawer, HennaQuickAddSheet,
});
