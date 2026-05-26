/* eslint-disable */
// Vendors — Henna & Pearl
// Trusted-services rolodex. Hero with count, search, filter pills, vendor
// rows with expandable Call / WhatsApp / Edit row.

const VendorsScreen = ({ onMenu }) => {
  const [filter, setFilter] = React.useState('All');
  const [expanded, setExpanded] = React.useState(2);
  const vendors = [
    { id: 1, name: 'Aslam Plumber',    cat: 'Plumber',     icon: 'wrench', phone: '0300-1234567', rating: 5, fav: true,  last: '12 Apr' },
    { id: 2, name: 'Khan Electrician', cat: 'Electrician', icon: 'bolt',   phone: '0312-9876543', rating: 4, fav: true,  last: '03 May' },
    { id: 3, name: 'Cool Breeze AC',   cat: 'AC Repair',   icon: 'snow',   phone: '0333-5552211', rating: 4, fav: false, last: '20 Apr' },
    { id: 4, name: 'Dr. Sara Ahmed',   cat: 'Doctor',      icon: 'doctor', phone: '0321-1112233', rating: 5, fav: false },
    { id: 5, name: 'Shifa Pharmacy',   cat: 'Pharmacy',    icon: 'pill',   phone: '042-3567890',  rating: 4, fav: false, last: '24 May' },
    { id: 6, name: 'Naseem Tailor',    cat: 'Tailor',      icon: 'tailor', phone: '0345-7778899', rating: 3, fav: false },
    { id: 7, name: 'Ali Carpenter',    cat: 'Carpenter',   icon: 'hammer', phone: '0301-4567890', rating: 4, fav: false, last: '18 Apr' },
  ];
  const cats = ['All', 'Favorites', 'Plumber', 'Electrician', 'Doctor', 'Pharmacy', 'Tailor'];
  const shown = filter === 'All' ? vendors
              : filter === 'Favorites' ? vendors.filter(v => v.fav)
              : vendors.filter(v => v.cat === filter);

  return (
    <div style={{ position: 'relative', height: '100%', background: 'var(--page-grad)', overflow: 'hidden' }}>
      <PaperNoise />
      <div style={{ position: 'relative', height: '100%', overflowY: 'auto', paddingBottom: 180 }}>
        <HennaHeader
          title="Vendors"
          subtitle={`${vendors.length} trusted service providers`}
          onMenu={onMenu}
        />

        {/* Hero with search */}
        <div style={{ padding: '0 16px' }}>
          <div style={{
            background: 'linear-gradient(160deg, #FBE7DD 0%, #F2D9CB 100%)',
            borderRadius: 28, padding: '20px 22px 22px',
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
                <div className="eyebrow" style={{ color: 'var(--henna)' }}>Rolodex</div>
              </div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 22, color: 'var(--ink)', marginTop: 6 }}>
                Your trusted help
              </div>
              <div style={{ fontFamily: 'var(--ui)', fontSize: 12, color: 'var(--ink-2)', marginTop: 6, lineHeight: 1.4 }}>
                Tap Call or WhatsApp to reach them. Long-press Call if a vendor has an alt number.
              </div>
              <div style={{ marginTop: 14 }}>
                <HennaInput icon="search" placeholder="Search by name or category" />
              </div>
            </div>
          </div>
        </div>

        {/* Filter pills */}
        <div style={{ padding: '16px 16px 0', overflowX: 'auto' }}>
          <div style={{ display: 'flex', gap: 6, paddingBottom: 4 }}>
            {cats.map(c => (
              <HennaPill key={c} active={filter === c} onClick={() => setFilter(c)} accent={c === 'Favorites' ? 'sage' : 'henna'}>
                {c}
              </HennaPill>
            ))}
          </div>
        </div>

        {/* Vendor list */}
        <div style={{ padding: '14px 16px' }}>
          <HennaCard padding={0}>
            {shown.map((v, i) => {
              const open = expanded === v.id;
              return (
                <div key={v.id} style={{ borderBottom: i < shown.length - 1 ? '1px solid var(--line)' : 'none' }}>
                  <button onClick={() => setExpanded(p => p === v.id ? null : v.id)} style={{
                    width: '100%', background: 'transparent', border: 0, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '14px 18px', textAlign: 'left',
                  }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 20,
                      background: 'var(--henna-bg)',
                      color: 'var(--henna)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <HennaIcon name={v.icon} size={18} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ fontFamily: 'var(--ui)', fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>{v.name}</div>
                        {v.fav && <HennaIcon name="star" size={12} color="var(--bronze)" />}
                      </div>
                      <div style={{ fontFamily: 'var(--ui)', fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                        {v.cat} · {v.phone}{v.last ? '  ·  last: ' + v.last : ''}
                      </div>
                      <div style={{ marginTop: 4, color: 'var(--bronze)', display: 'flex', gap: 1 }}>
                        {[1,2,3,4,5].map(n => (
                          <HennaIcon key={n} name="star" size={10} color={n <= v.rating ? 'var(--bronze)' : 'var(--soft)'} />
                        ))}
                      </div>
                    </div>
                    <HennaIcon name={open ? 'chev-down' : 'chev-right'} size={14} color="var(--muted)" />
                  </button>
                  {open && (
                    <div style={{ display: 'flex', gap: 8, padding: '0 18px 14px' }}>
                      <HennaButton variant="primary" size="sm" icon="phone" style={{ flex: 1 }}>Call</HennaButton>
                      <HennaButton variant="sage" size="sm" icon="message" style={{ flex: 1 }}>WhatsApp</HennaButton>
                      <HennaButton variant="outline" size="sm" icon="pencil">Edit</HennaButton>
                    </div>
                  )}
                </div>
              );
            })}
          </HennaCard>
        </div>
      </div>
    </div>
  );
};

window.VendorsScreen = VendorsScreen;
