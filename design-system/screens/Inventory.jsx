/* eslint-disable */
// Inventory — Henna & Pearl
// Pantry / fridge stock tracker. Filter pills + item rows with quantity + low-stock badges.

const InventoryScreen = ({ onMenu }) => {
  const [filter, setFilter] = React.useState('All');
  const items = [
    { id: 1, name: 'Atta',          cat: 'Pantry', qty: '2 kg',     low: false, icon: 'bread' },
    { id: 2, name: 'Rice',          cat: 'Pantry', qty: '500 g',    low: true,  icon: 'bread' },
    { id: 3, name: 'Cooking Oil',   cat: 'Pantry', qty: '1 bottle', low: false, icon: 'water' },
    { id: 4, name: 'Sugar',         cat: 'Pantry', qty: '300 g',    low: true,  icon: 'bread' },
    { id: 5, name: 'Milk',          cat: 'Fridge', qty: '500 ml',   low: false, icon: 'milk' },
    { id: 6, name: 'Yogurt',        cat: 'Fridge', qty: 'low',      low: true,  icon: 'milk' },
    { id: 7, name: 'Tomatoes',      cat: 'Fridge', qty: '4 pcs',    low: false, icon: 'veg' },
    { id: 8, name: 'Frozen Peas',   cat: 'Frozen', qty: '1 pack',   low: false, icon: 'snow' },
    { id: 9, name: 'Frozen Naan',   cat: 'Frozen', qty: '2 packs',  low: false, icon: 'bread' },
    { id:10, name: 'Cumin Powder',  cat: 'Spices', qty: '50 g',     low: false, icon: 'leaf' },
    { id:11, name: 'Red Chili',     cat: 'Spices', qty: 'out',      low: true,  icon: 'flame' },
  ];
  const cats = ['All', 'Pantry', 'Fridge', 'Frozen', 'Spices'];
  const shown = filter === 'All' ? items : items.filter(i => i.cat === filter);
  const lowCount = items.filter(i => i.low).length;

  return (
    <div style={{ position: 'relative', height: '100%', background: 'var(--page-grad)', overflow: 'hidden' }}>
      <PaperNoise />
      <div style={{ position: 'relative', height: '100%', overflowY: 'auto', paddingBottom: 180 }}>
        <HennaHeader
          title="Inventory"
          subtitle={`${items.length} items · ${lowCount} low stock`}
          onMenu={onMenu}
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
                <div className="eyebrow" style={{ color: 'var(--henna)' }}>Needs attention</div>
              </div>
              <div className="display-num" style={{ marginTop: 8 }}>
                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontWeight: 600, color: 'var(--henna)' }}>{lowCount}</span>
                <span style={{ fontFamily: 'var(--serif)', fontSize: 18, color: 'var(--ink-2)', marginLeft: 8 }}>low-stock items</span>
              </div>
              <div style={{ fontFamily: 'var(--ui)', fontSize: 12, color: 'var(--ink-2)', marginTop: 6 }}>
                Rice, Sugar, Yogurt, Red Chili
              </div>
              <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
                <HennaButton variant="primary" size="sm" icon="cart">Add to shopping</HennaButton>
                <HennaButton variant="outline" size="sm" icon="plus">New item</HennaButton>
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: '16px 16px 0', overflowX: 'auto' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {cats.map(c => <HennaPill key={c} active={filter === c} onClick={() => setFilter(c)}>{c}</HennaPill>)}
          </div>
        </div>

        <div style={{ padding: '14px 16px 0' }}>
          <HennaCard padding={0}>
            {shown.map((it, i) => (
              <div key={it.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '13px 18px',
                borderBottom: i < shown.length - 1 ? '1px solid var(--line)' : 'none',
              }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 17,
                  background: it.low ? 'var(--henna-bg)' : 'var(--sage-bg)',
                  color: it.low ? 'var(--henna)' : 'var(--sage)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <HennaIcon name={it.icon} size={17} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--ui)', fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>{it.name}</div>
                  <div style={{ fontFamily: 'var(--ui)', fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{it.cat}</div>
                </div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 14, color: 'var(--ink)' }}>{it.qty}</div>
                {it.low && <HennaBadge accent="henna">low</HennaBadge>}
              </div>
            ))}
          </HennaCard>
        </div>
      </div>
    </div>
  );
};

window.InventoryScreen = InventoryScreen;
