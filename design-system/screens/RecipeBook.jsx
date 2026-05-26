/* eslint-disable */
// Recipe Book — Henna & Pearl
// List + detail view. Hero with featured recipe, search/filter, recipe cards
// with cook-time + servings + in-stock badges.

const RecipeBookScreen = ({ onMenu }) => {
  const [filter, setFilter] = React.useState('All');
  const cats = ['All', 'Quick', 'Family', 'Sunday'];
  const recipes = [
    { id: 1, name: 'Chicken Biryani', mins: 90, servings: 6, missing: 2, fav: true,  cuisine: 'Mughlai',  ic: 'pot' },
    { id: 2, name: 'Daal Chawal',     mins: 30, servings: 4, missing: 0, fav: false, cuisine: 'Everyday', ic: 'pot' },
    { id: 3, name: 'Chicken Karahi',  mins: 45, servings: 4, missing: 1, fav: true,  cuisine: 'Punjabi',  ic: 'flame' },
    { id: 4, name: 'Chicken Pulao',   mins: 60, servings: 5, missing: 0, fav: false, cuisine: 'Sindhi',   ic: 'pot' },
    { id: 5, name: 'Kheer',           mins: 75, servings: 6, missing: 0, fav: false, cuisine: 'Sweet',    ic: 'milk' },
    { id: 6, name: 'Aloo Paratha',    mins: 25, servings: 3, missing: 0, fav: true,  cuisine: 'Breakfast',ic: 'bread' },
  ];

  return (
    <div style={{ position: 'relative', height: '100%', background: 'var(--page-grad)', overflow: 'hidden' }}>
      <PaperNoise />
      <div style={{ position: 'relative', height: '100%', overflowY: 'auto', paddingBottom: 180 }}>
        <HennaHeader
          title="Recipe Book"
          subtitle={`${recipes.length} recipes · ${recipes.filter(r => r.fav).length} favorites`}
          onMenu={onMenu}
        />

        {/* Featured */}
        <div style={{ padding: '0 16px' }}>
          <div style={{
            background: 'linear-gradient(160deg, #FBE7DD 0%, #F2D9CB 100%)',
            borderRadius: 28, padding: '20px 22px',
            boxShadow: '0 10px 30px rgba(147,73,57,0.10), inset 0 0 0 1px rgba(255,255,255,0.5)',
            position: 'relative', overflow: 'hidden',
          }}>
            <MeshOverlay />
            <div style={{ position: 'absolute', top: -6, right: -6 }}>
              <ArabesqueCorner size={100} color="#934939" opacity={0.13} />
            </div>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 80, height: 80, borderRadius: 20,
                background: 'var(--henna)', color: 'var(--paper)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 6px 16px rgba(147,73,57,0.30)',
                flexShrink: 0,
              }}>
                <HennaIcon name="pot" size={36} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MarginMark color="var(--henna)" />
                  <div className="eyebrow" style={{ color: 'var(--henna)' }}>Featured · today</div>
                </div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 22, color: 'var(--ink)', marginTop: 4, lineHeight: 1.1 }}>Chicken Biryani</div>
                <div style={{ fontFamily: 'var(--ui)', fontSize: 11, color: 'var(--muted)', marginTop: 6, display: 'flex', gap: 12 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><HennaIcon name="clock" size={11} /> 90 min</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><HennaIcon name="utensils" size={11} /> serves 6</span>
                </div>
                <div style={{ marginTop: 10 }}>
                  <HennaButton variant="primary" size="sm" icon="utensils">Cook tonight</HennaButton>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter pills */}
        <div style={{ padding: '18px 16px 0', display: 'flex', gap: 6 }}>
          {cats.map(c => <HennaPill key={c} active={filter === c} onClick={() => setFilter(c)}>{c}</HennaPill>)}
        </div>

        {/* Recipe cards grid */}
        <div style={{ padding: '14px 16px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {recipes.map(r => (
            <HennaCard key={r.id} padding={14} style={{ minHeight: 160 }}>
              <div style={{ display: 'flex', alignItems: 'start' }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 14,
                  background: 'var(--henna-bg)',
                  color: 'var(--henna)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <HennaIcon name={r.ic} size={20} />
                </div>
                <div style={{ flex: 1 }} />
                {r.fav && <HennaIcon name="star" size={14} color="var(--bronze)" />}
              </div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 16, color: 'var(--ink)', marginTop: 10, lineHeight: 1.15 }}>{r.name}</div>
              <div style={{ fontFamily: 'var(--ui)', fontSize: 10, color: 'var(--muted)', marginTop: 3 }}>{r.cuisine}</div>
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: 'var(--ui)', fontWeight: 600, fontSize: 11, color: 'var(--ink-2)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                  <HennaIcon name="clock" size={11} color="var(--muted)" />{r.mins}m
                </span>
                {r.missing > 0
                  ? <HennaBadge accent="henna">{r.missing} missing</HennaBadge>
                  : <HennaBadge accent="sage">in stock</HennaBadge>}
              </div>
            </HennaCard>
          ))}
        </div>
      </div>
    </div>
  );
};

window.RecipeBookScreen = RecipeBookScreen;
