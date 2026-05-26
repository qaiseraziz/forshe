/* eslint-disable */
// Shopping List — Henna & Pearl
// Category-grouped checklist. Hero with item count + auto-generate from
// week's meals nudge.

const ShoppingListScreen = ({ onMenu }) => {
  const [done, setDone] = React.useState({ 2: true, 6: true });
  const items = [
    { id: 1, name: 'Tomatoes (1 kg)',     cat: 'Vegetables', icon: 'veg' },
    { id: 2, name: 'Onions (2 kg)',       cat: 'Vegetables', icon: 'veg' },
    { id: 3, name: 'Coriander · bunch',   cat: 'Vegetables', icon: 'leaf' },
    { id: 4, name: 'Chicken (1.5 kg)',    cat: 'Meat',       icon: 'pot' },
    { id: 5, name: 'Naan · pack of 6',    cat: 'Bakery',     icon: 'bread' },
    { id: 6, name: 'Milk · 2 L',          cat: 'Dairy',      icon: 'milk' },
    { id: 7, name: 'Eggs · 1 dozen',      cat: 'Dairy',      icon: 'milk' },
    { id: 8, name: 'Atta · 5 kg',         cat: 'Pantry',     icon: 'bread' },
    { id: 9, name: 'Cumin powder',        cat: 'Pantry',     icon: 'leaf' },
    { id:10, name: 'Vitamin D · 100 ct',  cat: 'Pharmacy',   icon: 'pill' },
  ];
  const groups = ['Vegetables', 'Meat', 'Bakery', 'Dairy', 'Pantry', 'Pharmacy'];
  const totalDone = Object.values(done).filter(Boolean).length;

  const toggle = (id) => setDone(p => ({ ...p, [id]: !p[id] }));

  return (
    <div style={{ position: 'relative', height: '100%', background: 'var(--page-grad)', overflow: 'hidden' }}>
      <PaperNoise />
      <div style={{ position: 'relative', height: '100%', overflowY: 'auto', paddingBottom: 180 }}>
        <HennaHeader
          title="Shopping List"
          subtitle={`${items.length - totalDone} items left · ${totalDone} done`}
          onMenu={onMenu}
          action={<HennaIcon name="share" size={16} color="var(--muted)" />}
        />

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
                <div className="eyebrow" style={{ color: 'var(--henna)' }}>For tomorrow's bazaar trip</div>
              </div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 22, color: 'var(--ink)', marginTop: 6, letterSpacing: -0.3 }}>
                {items.length} items · 6 categories
              </div>
              <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
                <HennaButton variant="primary" size="sm" icon="plus">Add item</HennaButton>
                <HennaButton variant="outline" size="sm" icon="utensils">From this week</HennaButton>
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: '20px 16px 0' }}>
          {groups.map(g => {
            const groupItems = items.filter(i => i.cat === g);
            if (!groupItems.length) return null;
            return (
              <div key={g} style={{ marginBottom: 10 }}>
                <div className="eyebrow" style={{ padding: '6px 6px 8px' }}>{g}</div>
                <HennaCard padding={0}>
                  {groupItems.map((it, i) => {
                    const isDone = !!done[it.id];
                    return (
                      <button key={it.id} onClick={() => toggle(it.id)} style={{
                        width: '100%', background: 'transparent', border: 0, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '13px 18px', textAlign: 'left',
                        borderBottom: i < groupItems.length - 1 ? '1px solid var(--line)' : 'none',
                      }}>
                        <div style={{
                          width: 22, height: 22, borderRadius: 11,
                          background: isDone ? 'var(--sage)' : 'transparent',
                          border: isDone ? 'none' : '1.5px solid var(--line-strong)',
                          color: 'var(--paper)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          {isDone && <HennaIcon name="check" size={14} />}
                        </div>
                        <div style={{
                          width: 28, height: 28, borderRadius: 14,
                          background: 'var(--henna-bg)', color: 'var(--henna)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          opacity: isDone ? 0.4 : 1,
                        }}>
                          <HennaIcon name={it.icon} size={14} />
                        </div>
                        <div style={{
                          flex: 1,
                          fontFamily: 'var(--ui)', fontSize: 14, fontWeight: 500,
                          color: isDone ? 'var(--soft)' : 'var(--ink)',
                          textDecoration: isDone ? 'line-through' : 'none',
                          textDecorationColor: 'var(--soft)',
                        }}>{it.name}</div>
                      </button>
                    );
                  })}
                </HennaCard>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

window.ShoppingListScreen = ShoppingListScreen;
