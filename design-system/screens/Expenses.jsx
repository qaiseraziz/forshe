/* eslint-disable */
// Expenses — Henna & Pearl
// Hero with balance + budget, quick-add chip rail, transaction list with
// monthly section heads.

const ExpensesScreen = ({ onMenu, onQuickAdd }) => {
  const txns = [
    { id: 1, type: 'topup',   label: 'Received from husband', amount: 50000, cat: '—',            icon: 'wallet',     date: 'Today' },
    { id: 2, type: 'expense', label: 'Vegetables',            amount: 350,   cat: 'Food',         icon: 'veg',        date: 'Today' },
    { id: 3, type: 'expense', label: 'Rickshaw',              amount: 250,   cat: 'Transport',    icon: 'car',        date: 'Today' },
    { id: 4, type: 'expense', label: 'Electricity Bill',      amount: 4200,  cat: 'Bills',        icon: 'electricity',date: 'Yesterday' },
    { id: 5, type: 'expense', label: 'Milk',                  amount: 200,   cat: 'Food',         icon: 'milk',       date: 'Yesterday' },
    { id: 6, type: 'expense', label: 'Petrol',                amount: 1800,  cat: 'Transport',    icon: 'fuel',       date: 'Mon 24 May' },
    { id: 7, type: 'expense', label: 'Medicine',              amount: 650,   cat: 'Health',       icon: 'pill',       date: 'Mon 24 May' },
    { id: 8, type: 'expense', label: 'Eating Out',            amount: 2400,  cat: 'Food',         icon: 'pot',        date: 'Sun 23 May' },
  ];
  const fmt = n => 'Rs ' + n.toLocaleString('en-PK');
  const totalSpent = txns.filter(t => t.type === 'expense').reduce((s,t)=>s+t.amount, 0);
  const totalRec   = txns.filter(t => t.type === 'topup').reduce((s,t)=>s+t.amount, 0);
  const budget = 50000;

  const PRESETS = [
    { label: 'Vegetables',  icon: 'veg' },
    { label: 'Bread',       icon: 'bread' },
    { label: 'Milk',        icon: 'milk' },
    { label: 'Fruits',      icon: 'fruit' },
    { label: 'Grocery',     icon: 'cart' },
    { label: 'Petrol',      icon: 'fuel' },
    { label: 'Rickshaw',    icon: 'car' },
    { label: 'Medicine',    icon: 'pill' },
    { label: 'Electricity', icon: 'electricity' },
    { label: 'Gas',         icon: 'flame' },
    { label: 'Water',       icon: 'water' },
    { label: 'School',      icon: 'book' },
  ];

  return (
    <div style={{ position: 'relative', height: '100%', background: 'var(--page-grad)', overflow: 'hidden' }}>
      <PaperNoise />
      <div style={{ position: 'relative', height: '100%', overflowY: 'auto', paddingBottom: 180 }}>
        <HennaHeader
          title="Expenses"
          subtitle="May 2026 · track every rupee"
          onMenu={onMenu}
          action={
            <div style={{ display: 'flex', gap: 4 }}>
              <button aria-label="Search" style={{ width: 36, height: 36, borderRadius: 12, background: 'transparent', border: 0, cursor: 'pointer', color: 'var(--ink-2)' }}>
                <HennaIcon name="search" size={18} />
              </button>
              <button aria-label="Share" style={{ width: 36, height: 36, borderRadius: 12, background: 'transparent', border: 0, cursor: 'pointer', color: 'var(--ink-2)' }}>
                <HennaIcon name="share" size={18} />
              </button>
            </div>
          }
        />

        {/* Hero */}
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
                <div className="eyebrow" style={{ color: 'var(--henna)' }}>Balance</div>
              </div>
              <div className="display-num" style={{ marginTop: 8 }}>
                Rs 40,<span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontWeight: 600, color: 'var(--henna)' }}>150</span>
              </div>
              <div style={{ display: 'flex', gap: 14, marginTop: 10, alignItems: 'baseline' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--sage)' }}>
                  <HennaIcon name="chev-down" size={11} style={{ transform: 'rotate(180deg)' }} />
                  <span style={{ fontFamily: 'var(--ui)', fontWeight: 600, fontSize: 12 }}>{fmt(totalRec)}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--henna)' }}>
                  <HennaIcon name="chev-down" size={11} />
                  <span style={{ fontFamily: 'var(--ui)', fontWeight: 600, fontSize: 12 }}>{fmt(totalSpent)}</span>
                </div>
              </div>
              <div style={{ marginTop: 16, padding: '12px 14px', background: 'rgba(255,255,255,0.6)', borderRadius: 16 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 8 }}>
                  <div style={{ fontFamily: 'var(--ui)', fontSize: 11, fontWeight: 600, color: 'var(--ink-2)' }}>Monthly budget</div>
                  <div style={{ flex: 1 }} />
                  <div style={{ fontFamily: 'var(--serif)', fontSize: 14, color: 'var(--ink)' }}>{fmt(totalSpent)} / {fmt(budget)}</div>
                </div>
                <HennaProgress value={totalSpent} max={budget} accent="henna" />
                <div style={{ fontFamily: 'var(--ui)', fontSize: 10, color: 'var(--muted)', marginTop: 6 }}>
                  {fmt(budget - totalSpent)} remaining · {Math.round((totalSpent/budget)*100)}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick-add chips */}
        <div className="eyebrow" style={{ padding: '20px 24px 10px' }}>Quick Add</div>
        <div style={{ padding: '0 16px', overflowX: 'auto' }}>
          <div style={{ display: 'flex', gap: 8, paddingBottom: 6 }}>
            {PRESETS.map(p => (
              <button key={p.label} style={{
                flexShrink: 0, width: 78,
                background: 'var(--paper)', border: 0, cursor: 'pointer',
                padding: '12px 6px', borderRadius: 18,
                boxShadow: 'inset 0 0 0 1px var(--line), 0 2px 6px rgba(147,73,57,0.04)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                color: 'var(--henna)',
              }}>
                <HennaIcon name={p.icon} size={20} />
                <div style={{ fontFamily: 'var(--ui)', fontWeight: 600, fontSize: 10, color: 'var(--ink-2)' }}>{p.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Transactions */}
        <HennaSectionHead title="History" />
        <div style={{ padding: '0 16px' }}>
          {['Today','Yesterday','Mon 24 May','Sun 23 May'].map(day => {
            const items = txns.filter(t => t.date === day);
            if (!items.length) return null;
            return (
              <div key={day} style={{ marginBottom: 10 }}>
                <div className="eyebrow" style={{ padding: '6px 6px 8px' }}>{day}</div>
                <HennaCard padding={0}>
                  {items.map((t, i) => (
                    <div key={t.id} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 18px',
                      borderBottom: i < items.length - 1 ? '1px solid var(--line)' : 'none',
                    }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: 17,
                        background: t.type === 'topup' ? 'var(--sage-bg)' : 'var(--henna-bg)',
                        color: t.type === 'topup' ? 'var(--sage)' : 'var(--henna)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <HennaIcon name={t.icon} size={16} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: 'var(--ui)', fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>{t.label}</div>
                        <div style={{ fontFamily: 'var(--ui)', fontSize: 10, color: 'var(--muted)', marginTop: 1 }}>{t.cat}</div>
                      </div>
                      <div style={{
                        fontFamily: 'var(--serif)', fontSize: 15,
                        color: t.type === 'topup' ? 'var(--sage)' : 'var(--ink)',
                      }}>
                        {t.type === 'topup' ? '+ ' : '− '}{fmt(t.amount)}
                      </div>
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

window.ExpensesScreen = ExpensesScreen;
