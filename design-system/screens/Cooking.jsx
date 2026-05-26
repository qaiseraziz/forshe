/* eslint-disable */
// Cooking — Henna & Pearl
// Weekly meal plan. Hero with current focus, day-strip, 3-meal rows per day.

const CookingScreen = ({ onMenu }) => {
  const [day, setDay] = React.useState('Tue');
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const week = {
    Mon: { Breakfast: 'Boiled egg + toast', Lunch: 'Aloo Gosht · Roti', Dinner: 'Daal Chawal' },
    Tue: { Breakfast: 'Aloo Paratha · Chai', Lunch: 'Chicken Karahi · Salad · Naan', Dinner: 'Daal Chawal' },
    Wed: { Breakfast: 'Cheese omelette',   Lunch: '—', Dinner: 'Biryani' },
    Thu: { Breakfast: 'Halwa Puri',        Lunch: '—', Dinner: 'Karahi' },
    Fri: { Breakfast: '—',                 Lunch: 'Pulao',  Dinner: 'Qorma' },
    Sat: { Breakfast: 'Paratha',           Lunch: '—', Dinner: '—' },
    Sun: { Breakfast: 'Paratha',           Lunch: 'Biryani', Dinner: 'Kheer' },
  };
  const today = week[day];

  return (
    <div style={{ position: 'relative', height: '100%', background: 'var(--page-grad)', overflow: 'hidden' }}>
      <PaperNoise />
      <div style={{ position: 'relative', height: '100%', overflowY: 'auto', paddingBottom: 180 }}>
        <HennaHeader
          title="Cooking"
          subtitle="Week of 26 May"
          onMenu={onMenu}
          action={<button aria-label="Cart" style={{ width: 36, height: 36, borderRadius: 12, background: 'transparent', border: 0, cursor: 'pointer', color: 'var(--ink-2)' }}><HennaIcon name="cart" size={18} /></button>}
        />

        {/* Hero */}
        <div style={{ padding: '0 16px' }}>
          <div style={{
            background: 'linear-gradient(160deg, #EFE5D2 0%, #E2D4B2 100%)',
            borderRadius: 28, padding: '20px 22px',
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
                <div className="eyebrow" style={{ color: 'var(--bronze)' }}>Tonight's dinner</div>
              </div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 26, color: 'var(--ink)', marginTop: 6, letterSpacing: -0.3 }}>Daal Chawal</div>
              <div style={{ fontFamily: 'var(--ui)', fontSize: 12, color: 'var(--ink-2)', marginTop: 6 }}>
                30 min · ingredients ready
              </div>
              <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
                <HennaButton variant="bronze" size="sm" icon="utensils">Start cooking</HennaButton>
                <HennaButton variant="outline" size="sm" icon="book">Recipe</HennaButton>
              </div>
            </div>
          </div>
        </div>

        {/* Day strip */}
        <div style={{ padding: '20px 16px 12px', display: 'flex', gap: 6, justifyContent: 'space-between' }}>
          {days.map(d => {
            const isActive = d === day;
            return (
              <button key={d} onClick={() => setDay(d)} style={{
                flex: 1, padding: '10px 0', borderRadius: 16,
                background: isActive ? 'var(--henna)' : 'var(--paper)',
                color: isActive ? 'var(--paper)' : 'var(--ink-2)',
                border: 0, cursor: 'pointer',
                boxShadow: isActive ? '0 4px 12px rgba(147,73,57,0.22)' : 'inset 0 0 0 1px var(--line)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              }}>
                <div style={{ fontFamily: 'var(--ui)', fontSize: 10, fontWeight: 600, letterSpacing: 0.5, opacity: 0.8 }}>{d}</div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 16 }}>{['25','26','27','28','29','30','31'][days.indexOf(d)]}</div>
              </button>
            );
          })}
        </div>

        {/* Meals for selected day */}
        <div style={{ padding: '0 16px' }}>
          {['Breakfast','Lunch','Dinner'].map((meal, i) => {
            const ic = meal === 'Breakfast' ? 'sun' : meal === 'Lunch' ? 'pot' : 'moon';
            const accent = meal === 'Breakfast' ? 'bronze' : meal === 'Lunch' ? 'henna' : 'plum';
            const filled = today[meal] && today[meal] !== '—';
            return (
              <HennaCard key={meal} padding={0} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px' }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 22,
                    background: `var(--${accent}-bg)`,
                    color: `var(--${accent})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <HennaIcon name={ic} size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="eyebrow">{meal}</div>
                    {filled ? (
                      <div style={{ fontFamily: 'var(--serif)', fontSize: 16, color: 'var(--ink)', marginTop: 3 }}>{today[meal]}</div>
                    ) : (
                      <div style={{ fontFamily: 'var(--ui)', fontStyle: 'italic', fontSize: 13, color: 'var(--soft)', marginTop: 3 }}>Tap to plan</div>
                    )}
                  </div>
                  {filled
                    ? <HennaIcon name="pencil" size={14} color="var(--muted)" />
                    : <HennaIcon name="plus" size={16} color={`var(--${accent})`} />}
                </div>
              </HennaCard>
            );
          })}
        </div>

        {/* Shopping-from-week nudge */}
        <div style={{ padding: '4px 16px 0' }}>
          <button style={{
            width: '100%',
            background: 'var(--paper)',
            border: '1px dashed var(--line-strong)',
            borderRadius: 22, padding: '14px',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 12,
            color: 'var(--ink-2)',
          }}>
            <HennaIcon name="cart" size={18} color="var(--henna)" />
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={{ fontFamily: 'var(--ui)', fontWeight: 600, fontSize: 13, color: 'var(--ink)' }}>Generate shopping list</div>
              <div style={{ fontFamily: 'var(--ui)', fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>From this week's meals · subtract inventory</div>
            </div>
            <HennaIcon name="chev-right" size={14} color="var(--muted)" />
          </button>
        </div>
      </div>
    </div>
  );
};

window.CookingScreen = CookingScreen;
