import React, { useCallback, useMemo, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  FlatList,
  Switch,
  Linking,
  ListRenderItem,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import * as Haptics from 'expo-haptics';
import * as Contacts from 'expo-contacts';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { gradients } from '../constants/colors';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Divider } from '../components/ui/Divider';
import { EmptyState } from '../components/ui/EmptyState';
import { Toast, useToast } from '../components/ui/Toast';
import { DrawerMenuButton } from '../components/DrawerMenuButton';
import { VENDOR_CATS } from '../constants/data';
import { Vendor, VendorCategory } from '../types';
import { SwipeableRow } from '../components/ui/SwipeableRow';
import { SkeletonCardRow } from '../components/ui/Skeleton';

type FilterKey = 'all' | 'favorites' | VendorCategory;

function cleanPhone(phone: string): string {
  return phone.replace(/[\s\-()]/g, '');
}

function countDigits(phone: string): number {
  return phone.replace(/\D/g, '').length;
}

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function VendorsScreen() {
  const { colors, dark } = useTheme();
  const insets = useSafeAreaInsets();
  const { vendors, setVendors, allLoaded } = useData();
  const { toast, show: showToast, dismiss: dismissToast } = useToast();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Form state
  const [fName, setFName] = useState('');
  const [fCategory, setFCategory] = useState<VendorCategory>('Plumber');
  const [fPhone, setFPhone] = useState('');
  const [fAltPhone, setFAltPhone] = useState('');
  const [fAddress, setFAddress] = useState('');
  const [fRating, setFRating] = useState(0);
  const [fFavorite, setFFavorite] = useState(false);
  const [fNotes, setFNotes] = useState('');

  // v1.2.17: contact-picker state — user can import name + phone from
  // their phone's address book instead of typing.
  type DeviceContact = { id: string; name: string; phones: string[] };
  const [contactsModalOpen, setContactsModalOpen] = useState(false);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactsList, setContactsList] = useState<DeviceContact[]>([]);
  const [contactsSearch, setContactsSearch] = useState('');

  // v1.2.5-dev: keyboard flow refs for the Add/Edit modal.
  const vNameRef = useRef<TextInput | null>(null);
  const vPhoneRef = useRef<TextInput | null>(null);
  const vAltPhoneRef = useRef<TextInput | null>(null);
  const vAddressRef = useRef<TextInput | null>(null);
  const vNotesRef = useRef<TextInput | null>(null);

  const resetForm = useCallback(() => {
    setFName('');
    setFCategory('Plumber');
    setFPhone('');
    setFAltPhone('');
    setFAddress('');
    setFRating(0);
    setFFavorite(false);
    setFNotes('');
    setEditingId(null);
  }, []);

  const openAdd = useCallback(() => {
    resetForm();
    setModalOpen(true);
  }, [resetForm]);

  // v1.2.17: open the device contact picker. Requests permission, loads
  // contacts (name + phones), filters in-memory.
  const openContactPicker = useCallback(async () => {
    setContactsLoading(true);
    setContactsSearch('');
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission needed',
          'Please allow contact access in your device settings to import vendors from your address book.',
        );
        setContactsLoading(false);
        return;
      }
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
        sort: Contacts.SortTypes.FirstName,
      });
      const mapped: DeviceContact[] = data
        .map(c => ({
          id: c.id || `${c.name}-${Math.random()}`,
          name: c.name || 'Unnamed',
          phones: (c.phoneNumbers || [])
            .map(p => (p.number || '').trim())
            .filter(p => p.length > 0),
        }))
        .filter(c => c.phones.length > 0);
      setContactsList(mapped);
      setContactsModalOpen(true);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not load contacts.');
    } finally {
      setContactsLoading(false);
    }
  }, []);

  const pickContact = useCallback((c: DeviceContact) => {
    Haptics.selectionAsync();
    setFName(c.name);
    setFPhone(c.phones[0] || '');
    if (c.phones.length > 1) setFAltPhone(c.phones[1]);
    setContactsModalOpen(false);
  }, []);

  const filteredContacts = useMemo(() => {
    const q = contactsSearch.trim().toLowerCase();
    if (!q) return contactsList;
    return contactsList.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.phones.some(p => p.replace(/\D/g, '').includes(q.replace(/\D/g, ''))),
    );
  }, [contactsList, contactsSearch]);

  const openEdit = useCallback((vendor: Vendor) => {
    setEditingId(vendor.id);
    setFName(vendor.name);
    setFCategory(vendor.category);
    setFPhone(vendor.phone);
    setFAltPhone(vendor.altPhone || '');
    setFAddress(vendor.address || '');
    setFRating(vendor.rating);
    setFFavorite(vendor.favorite);
    setFNotes(vendor.notes || '');
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    resetForm();
  }, [resetForm]);

  const saveVendor = useCallback(() => {
    const name = fName.trim();
    const phone = fPhone.trim();
    if (!name) {
      Alert.alert('Missing name', 'Please enter a vendor name.');
      return;
    }
    if (!phone) {
      Alert.alert('Missing phone', 'Please enter a primary phone number.');
      return;
    }
    if (countDigits(phone) < 7) {
      Alert.alert('Invalid phone', 'Phone number must contain at least 7 digits.');
      return;
    }
    const altPhone = fAltPhone.trim();
    if (altPhone && countDigits(altPhone) < 7) {
      Alert.alert('Invalid alt phone', 'Alternate phone must contain at least 7 digits.');
      return;
    }

    if (editingId !== null) {
      setVendors(prev => prev.map(v => (
        v.id === editingId
          ? {
              ...v,
              name,
              category: fCategory,
              phone,
              altPhone: altPhone || undefined,
              address: fAddress.trim() || undefined,
              rating: fRating,
              favorite: fFavorite,
              notes: fNotes.trim() || undefined,
            }
          : v
      )));
      showToast('Vendor updated');
    } else {
      const vendor: Vendor = {
        id: Date.now(),
        name,
        category: fCategory,
        phone,
        altPhone: altPhone || undefined,
        address: fAddress.trim() || undefined,
        rating: fRating,
        favorite: fFavorite,
        notes: fNotes.trim() || undefined,
        createdAt: new Date().toISOString(),
      };
      setVendors(prev => [vendor, ...prev]);
      showToast('Vendor added');
    }
    Haptics.selectionAsync();
    closeModal();
  }, [fName, fCategory, fPhone, fAltPhone, fAddress, fRating, fFavorite, fNotes, editingId, setVendors, showToast, closeModal]);

  const deleteVendor = useCallback((id: number) => {
    const target = vendors.find(v => v.id === id);
    if (!target) return;
    Alert.alert('Delete Vendor', `Remove "${target.name}" from your directory?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setVendors(prev => prev.filter(v => v.id !== id));
          Haptics.selectionAsync();
          showToast(target.name + ' deleted', () => {
            setVendors(prev => [target, ...prev]);
          });
        },
      },
    ]);
  }, [vendors, setVendors, showToast]);

  const toggleFavorite = useCallback((id: number) => {
    setVendors(prev => prev.map(v => (v.id === id ? { ...v, favorite: !v.favorite } : v)));
    Haptics.selectionAsync();
  }, [setVendors]);

  const toggleExpanded = useCallback((id: number) => {
    setExpandedId(prev => (prev === id ? null : id));
  }, []);

  const stampUsed = useCallback((id: number) => {
    const stamp = todayISO();
    setVendors(prev => prev.map(v => (v.id === id ? { ...v, lastUsed: stamp } : v)));
  }, [setVendors]);

  const placeCall = useCallback((phone: string, id: number) => {
    const clean = cleanPhone(phone);
    Linking.openURL('tel:' + clean).catch(() => {
      Alert.alert('Unable to call', 'Could not open the phone dialer.');
    });
    stampUsed(id);
  }, [stampUsed]);

  const handleCall = useCallback((vendor: Vendor) => {
    if (vendor.altPhone) {
      Alert.alert(
        'Call ' + vendor.name,
        'Choose which number to call',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Primary: ' + vendor.phone, onPress: () => placeCall(vendor.phone, vendor.id) },
          { text: 'Alt: ' + vendor.altPhone, onPress: () => placeCall(vendor.altPhone!, vendor.id) },
        ],
      );
    } else {
      placeCall(vendor.phone, vendor.id);
    }
  }, [placeCall]);

  const handleCallPress = useCallback((vendor: Vendor) => {
    // Short press: always primary. Alt chosen via long-press.
    placeCall(vendor.phone, vendor.id);
  }, [placeCall]);

  const handleWhatsApp = useCallback((vendor: Vendor) => {
    const clean = cleanPhone(vendor.phone);
    const url = 'https://wa.me/' + clean;
    Linking.openURL(url).catch(() => {
      Alert.alert('Unable to open WhatsApp', 'Could not open WhatsApp for this number.');
    });
    stampUsed(vendor.id);
  }, [stampUsed]);

  // Counts per category (for filter pill visibility — hide empty categories)
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const v of vendors) {
      counts[v.category] = (counts[v.category] || 0) + 1;
    }
    return counts;
  }, [vendors]);

  const favoritesCount = useMemo(
    () => vendors.filter(v => v.favorite).length,
    [vendors],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const matchesFilter = (v: Vendor): boolean => {
      if (filter === 'all') return true;
      if (filter === 'favorites') return v.favorite;
      return v.category === filter;
    };
    const matchesSearch = (v: Vendor): boolean => {
      if (!q) return true;
      return (
        v.name.toLowerCase().includes(q) ||
        v.category.toLowerCase().includes(q)
      );
    };
    return vendors
      .filter(matchesFilter)
      .filter(matchesSearch)
      .sort((a, b) => {
        // favorites first
        if (a.favorite !== b.favorite) return a.favorite ? -1 : 1;
        // then lastUsed desc (recent first) — entries without lastUsed go after
        if (a.lastUsed && b.lastUsed) {
          if (a.lastUsed !== b.lastUsed) return a.lastUsed < b.lastUsed ? 1 : -1;
        } else if (a.lastUsed) {
          return -1;
        } else if (b.lastUsed) {
          return 1;
        }
        // alphabetical fallback
        return a.name.localeCompare(b.name);
      });
  }, [vendors, search, filter]);

  const filterPills = useMemo(() => {
    const pills: { key: FilterKey; label: string; icon?: string }[] = [
      { key: 'all', label: 'All' },
    ];
    if (favoritesCount > 0) {
      pills.push({ key: 'favorites', label: '★ Favorites' });
    }
    for (const c of VENDOR_CATS) {
      if (categoryCounts[c.key] && categoryCounts[c.key] > 0) {
        pills.push({ key: c.key, label: c.label, icon: c.icon });
      }
    }
    return pills;
  }, [favoritesCount, categoryCounts]);

  const setRating = useCallback((n: number) => {
    setFRating(prev => (prev === n ? 0 : n));
    Haptics.selectionAsync();
  }, []);

  const keyExtractor = useCallback((v: Vendor) => String(v.id), []);

  const renderStars = useCallback((rating: number) => {
    if (rating <= 0) return null;
    const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
    return (
      <Text style={[styles.starText, { color: colors.gold }]}>{stars}</Text>
    );
  }, [colors.gold]);

  const renderVendorItem: ListRenderItem<Vendor> = useCallback(({ item }) => {
    const catDef = VENDOR_CATS.find(c => c.key === item.category);
    const isExpanded = expandedId === item.id;
    return (
      <SwipeableRow
        itemLabel={item.name}
        actions={[
          { kind: 'call', onPress: () => handleCallPress(item) },
          { kind: 'delete', onPress: () => deleteVendor(item.id) },
        ]}
      >
      <Card>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => toggleExpanded(item.id)}
          accessibilityRole="button"
          accessibilityLabel={(isExpanded ? 'Collapse ' : 'Expand ') + item.name}
        >
          <View style={styles.vendorRow}>
            <View style={[styles.iconCircle, { backgroundColor: colors.goldBg }]}>
              <Text style={styles.iconEmoji}>{catDef?.icon || '📋'}</Text>
            </View>
            <View style={styles.vendorContent}>
              <View style={styles.vendorTopRow}>
                <Text style={[styles.vendorName, { color: colors.deep }]} numberOfLines={1}>
                  {item.name}
                </Text>
                {item.favorite && (
                  <Badge text="★ Pinned" bg={colors.goldBg} color={colors.gold} />
                )}
              </View>
              <Text style={[styles.vendorCat, { color: colors.muted }]}>
                {catDef?.label || item.category}
              </Text>
              <Text style={[styles.vendorPhone, { color: colors.sub }]} numberOfLines={1}>
                📞 {item.phone}
              </Text>
              {renderStars(item.rating)}
              {item.lastUsed && (
                <Text style={[styles.lastUsed, { color: colors.muted }]}>
                  Last contacted {item.lastUsed}
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.favBtn}
              onPress={() => toggleFavorite(item.id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel={(item.favorite ? 'Unpin ' : 'Pin ') + item.name}
            >
              <Text style={[styles.favIcon, { color: item.favorite ? colors.gold : colors.muted }]}>
                {item.favorite ? '★' : '☆'}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <>
            {item.address ? (
              <Text style={[styles.expandedText, { color: colors.sub }]}>
                📍 {item.address}
              </Text>
            ) : null}
            {item.notes ? (
              <Text style={[styles.expandedText, { color: colors.muted }]}>
                📝 {item.notes}
              </Text>
            ) : null}

            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.goldBg }]}
                onPress={() => handleCallPress(item)}
                onLongPress={() => handleCall(item)}
                delayLongPress={350}
                accessibilityRole="button"
                accessibilityLabel={'Call ' + item.name}
              >
                <Text style={[styles.actionBtnText, { color: colors.gold }]}>📞 Call</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.greenBg }]}
                onPress={() => handleWhatsApp(item)}
                accessibilityRole="button"
                accessibilityLabel={'WhatsApp ' + item.name}
              >
                <Text style={[styles.actionBtnText, { color: colors.green }]}>💬 WhatsApp</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.bg3 }]}
                onPress={() => openEdit(item)}
                accessibilityRole="button"
                accessibilityLabel={'Edit ' + item.name}
              >
                <Text style={[styles.actionBtnText, { color: colors.sub }]}>✏️ Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnIcon, { backgroundColor: colors.redBg }]}
                onPress={() => deleteVendor(item.id)}
                accessibilityRole="button"
                accessibilityLabel={'Delete ' + item.name}
              >
                <Text style={[styles.actionBtnText, { color: colors.red }]}>🗑</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </Card>
      </SwipeableRow>
    );
  }, [expandedId, colors, toggleExpanded, toggleFavorite, handleCall, handleCallPress, handleWhatsApp, openEdit, deleteVendor, renderStars]);

  const listHeader = useMemo(() => (
    <View>
      {/* Hero */}
      <Card gradient={dark ? gradients.goldHeroDark : gradients.goldHero} style={{ backgroundColor: colors.goldBg, borderColor: colors.goldBorder }}>
        <View style={styles.heroHeaderRow}>
          <DrawerMenuButton />
          <View style={styles.heroHeaderText}>
            <Text style={[styles.heroLabel, { color: colors.gold }]}>💼 Vendors</Text>
            <Text style={[styles.heroNum, { color: colors.gold }]}>{vendors.length}</Text>
            <Text style={[styles.heroSub, { color: colors.sub }]}>
              Your trusted service providers
            </Text>
          </View>
        </View>
      </Card>

      {/* Search + Add */}
      <View style={styles.searchRow}>
        <View style={{ flex: 1 }}>
          <Input placeholder="Search vendors…" value={search} onChangeText={setSearch} />
        </View>
        <Button title="+ Add" variant="gold" onPress={openAdd} />
      </View>

      {/* Filter pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsRail}>
        {filterPills.map(p => {
          const active = filter === p.key;
          return (
            <TouchableOpacity
              key={String(p.key)}
              style={[styles.pill, { backgroundColor: active ? colors.goldBg : colors.bg3 }]}
              onPress={() => setFilter(p.key)}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={[styles.pillText, { color: active ? colors.gold : colors.sub }]}>
                {p.icon ? p.icon + ' ' : ''}{p.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Divider label={`Contacts · ${filtered.length}`} />
    </View>
  ), [dark, colors, vendors.length, search, openAdd, filterPills, filter, filtered.length]);

  const listEmpty = useMemo(() => {
    if (!allLoaded) {
      return (
        <View>
          <SkeletonCardRow />
          <SkeletonCardRow />
          <SkeletonCardRow />
          <SkeletonCardRow />
        </View>
      );
    }
    return (
      <EmptyState
        icon="💼"
        text={vendors.length === 0
          ? 'Add your trusted service providers so they’re one tap away.'
          : 'No vendors match this filter.'}
        hint={vendors.length === 0
          ? 'Tap + to save a plumber, doctor, or anyone you rely on.'
          : undefined}
      />
    );
  }, [vendors.length, allLoaded]);

  return (
    <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.container}>
      <FlatList
        data={filtered}
        keyExtractor={keyExtractor}
        renderItem={renderVendorItem}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        windowSize={10}
        initialNumToRender={10}
        removeClippedSubviews
      />

      {/* Add / Edit Modal */}
      <Modal visible={modalOpen} transparent animationType="slide" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.bg2 }]}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={[styles.modalTitle, { color: colors.deep }]}>
                {editingId !== null ? 'Edit Vendor' : 'Add Vendor'}
              </Text>

              {/* v1.2.17: pick from device contacts (only when adding, not editing). */}
              {editingId === null && (
                <TouchableOpacity
                  onPress={openContactPicker}
                  activeOpacity={0.8}
                  disabled={contactsLoading}
                  style={[styles.contactsCta, { backgroundColor: colors.blueBg, borderColor: colors.blueBorder }]}
                  accessibilityRole="button"
                  accessibilityLabel="Import vendor from your phone contacts"
                >
                  <Text style={styles.contactsCtaIcon}>📇</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.contactsCtaTitle, { color: colors.blue }]}>
                      {contactsLoading ? 'Loading contacts…' : 'Pick from Contacts'}
                    </Text>
                    <Text style={[styles.contactsCtaSub, { color: colors.sub }]}>
                      Pre-fills name + phone from your address book
                    </Text>
                  </View>
                  <Text style={[styles.contactsCtaChevron, { color: colors.blue }]}>›</Text>
                </TouchableOpacity>
              )}

              <Input
                ref={vNameRef}
                label="Name"
                placeholder="e.g. Ali Plumbing"
                value={fName}
                onChangeText={setFName}
                style={{ marginBottom: 12 }}
                autoFocus={editingId !== null}
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => vPhoneRef.current?.focus()}
              />

              <Text style={[styles.fieldLabel, { color: colors.muted }]}>CATEGORY</Text>
              <View style={[styles.pickerWrap, { backgroundColor: colors.bg3 }]}>
                <Picker
                  selectedValue={fCategory}
                  onValueChange={v => setFCategory(v)}
                  style={{ color: colors.text }}
                  dropdownIconColor={colors.muted}
                >
                  {VENDOR_CATS.map(c => (
                    <Picker.Item key={c.key} value={c.key} label={`${c.icon}  ${c.label}`} />
                  ))}
                </Picker>
              </View>

              <Input
                ref={vPhoneRef}
                label="Phone"
                placeholder="e.g. 0300 1234567"
                value={fPhone}
                onChangeText={setFPhone}
                keyboardType="phone-pad"
                style={{ marginBottom: 12 }}
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => vAltPhoneRef.current?.focus()}
              />

              <Input
                ref={vAltPhoneRef}
                label="Alt phone (optional)"
                placeholder="e.g. 021 1234567"
                value={fAltPhone}
                onChangeText={setFAltPhone}
                keyboardType="phone-pad"
                style={{ marginBottom: 12 }}
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => vAddressRef.current?.focus()}
              />

              <Input
                ref={vAddressRef}
                label="Address (optional)"
                placeholder="Shop, street, area"
                value={fAddress}
                onChangeText={setFAddress}
                multiline
                style={{ marginBottom: 12 }}
              />

              <Text style={[styles.fieldLabel, { color: colors.muted }]}>RATING</Text>
              <View style={styles.ratingRow}>
                {[1, 2, 3, 4, 5].map(n => (
                  <TouchableOpacity
                    key={n}
                    onPress={() => setRating(n)}
                    style={styles.starBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityRole="button"
                    accessibilityLabel={`${n} star${n > 1 ? 's' : ''}`}
                  >
                    <Text style={[styles.starBtnText, { color: n <= fRating ? colors.gold : colors.muted }]}>
                      {n <= fRating ? '★' : '☆'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={[styles.switchRow, { marginTop: 16 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.switchTitle, { color: colors.deep }]}>Pin as favorite</Text>
                  <Text style={[styles.switchSub, { color: colors.muted }]}>Show at the top of the list</Text>
                </View>
                <Switch
                  value={fFavorite}
                  onValueChange={setFFavorite}
                  trackColor={{ false: colors.border, true: colors.gold }}
                  thumbColor="#fff"
                />
              </View>

              <Input
                ref={vNotesRef}
                label="Notes (optional)"
                placeholder="e.g. Fair prices, reliable"
                value={fNotes}
                onChangeText={setFNotes}
                multiline
                style={{ marginTop: 12 }}
                returnKeyType="done"
                onSubmitEditing={saveVendor}
              />

              <View style={styles.modalBtns}>
                <Button title="Cancel" variant="outline" small onPress={closeModal} style={{ flex: 1 }} />
                <Button title={editingId !== null ? 'Save' : 'Add'} variant="gold" small onPress={saveVendor} style={{ flex: 1 }} />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* v1.2.17: Contact picker modal */}
      <Modal
        visible={contactsModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setContactsModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.bg }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.deep }]}>Pick a contact</Text>
              <TouchableOpacity
                onPress={() => setContactsModalOpen(false)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityLabel="Close contact picker"
                accessibilityRole="button"
              >
                <Text style={[styles.modalClose, { color: colors.muted }]}>✕</Text>
              </TouchableOpacity>
            </View>
            <Input
              placeholder="Search by name or number…"
              value={contactsSearch}
              onChangeText={setContactsSearch}
              style={{ marginBottom: 12 }}
            />
            <FlatList
              data={filteredContacts}
              keyExtractor={c => c.id}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => pickContact(item)}
                  activeOpacity={0.7}
                  style={[styles.contactRow, { backgroundColor: colors.bg2, borderColor: colors.border }]}
                  accessibilityRole="button"
                  accessibilityLabel={`Pick ${item.name}`}
                >
                  <View style={[styles.contactAvatar, { backgroundColor: colors.blueBg }]}>
                    <Text style={[styles.contactAvatarText, { color: colors.blue }]}>
                      {item.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.contactName, { color: colors.deep }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={[styles.contactPhone, { color: colors.sub }]} numberOfLines={1}>
                      {item.phones[0]}
                      {item.phones.length > 1 ? ` · +${item.phones.length - 1} more` : ''}
                    </Text>
                  </View>
                  <Text style={[styles.contactsCtaChevron, { color: colors.muted }]}>›</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={[styles.contactEmpty, { color: colors.muted }]}>
                  {contactsSearch.trim()
                    ? 'No contacts match your search.'
                    : 'No contacts with phone numbers found on this device.'}
                </Text>
              }
            />
          </View>
        </View>
      </Modal>

      <Toast toast={toast} dismiss={dismissToast} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 140 },
  heroHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 4 },
  heroHeaderText: { flex: 1 },
  heroLabel: { fontSize: 12, fontFamily: 'Outfit-Bold', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 },
  heroNum: { fontFamily: 'PlayfairDisplay-ExtraBold', fontSize: 42, lineHeight: 48 },
  heroSub: { fontSize: 14, fontFamily: 'Outfit-Regular', marginTop: 4 },
  searchRow: { flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 12 },
  pillsRail: { flexGrow: 0, marginBottom: 8 },
  pill: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, marginRight: 8, minHeight: 44, justifyContent: 'center' },
  pillText: { fontSize: 13, fontFamily: 'Outfit-SemiBold' },
  vendorRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  iconCircle: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  iconEmoji: { fontSize: 22 },
  vendorContent: { flex: 1, minWidth: 0 },
  vendorTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 },
  vendorName: { fontFamily: 'Outfit-Bold', fontSize: 16, flexShrink: 1 },
  vendorCat: { fontSize: 12, fontFamily: 'Outfit-Regular', marginBottom: 2 },
  vendorPhone: { fontSize: 14, fontFamily: 'Outfit-SemiBold' },
  starText: { fontSize: 13, fontFamily: 'Outfit-Bold', marginTop: 4, letterSpacing: 2 },
  lastUsed: { fontSize: 11, fontFamily: 'Outfit-Regular', marginTop: 4 },
  favBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  favIcon: { fontSize: 24, fontFamily: 'Outfit-Bold' },
  expandedText: { fontSize: 13, fontFamily: 'Outfit-Regular', marginTop: 10 },
  actionsRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  actionBtn: { flex: 1, minHeight: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  actionBtnIcon: { flex: 0, width: 44 },
  actionBtnText: { fontSize: 13, fontFamily: 'Outfit-SemiBold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalBox: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: '88%' },
  modalTitle: { fontSize: 22, fontFamily: 'PlayfairDisplay-Bold', marginBottom: 18 },
  fieldLabel: { fontSize: 12, fontFamily: 'Outfit-Bold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  pickerWrap: { borderRadius: 16, overflow: 'hidden', marginBottom: 12 },
  ratingRow: { flexDirection: 'row', gap: 4, marginBottom: 4 },
  starBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  starBtnText: { fontSize: 28, fontFamily: 'Outfit-Bold' },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  switchTitle: { fontSize: 15, fontFamily: 'Outfit-SemiBold' },
  switchSub: { fontSize: 12, fontFamily: 'Outfit-Regular', marginTop: 2 },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 18, marginBottom: 12 },
  // v1.2.17: contact picker styles
  modalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: '88%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  modalClose: { fontSize: 22, fontFamily: 'Outfit-Bold' },
  contactsCta: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 16 },
  contactsCtaIcon: { fontSize: 24 },
  contactsCtaTitle: { fontSize: 15, fontFamily: 'Outfit-Bold' },
  contactsCtaSub: { fontSize: 12, fontFamily: 'Outfit-Regular', marginTop: 2 },
  contactsCtaChevron: { fontSize: 24, fontFamily: 'Outfit-Bold' },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, borderWidth: 1, marginBottom: 8 },
  contactAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  contactAvatarText: { fontSize: 18, fontFamily: 'Outfit-Bold' },
  contactName: { fontSize: 15, fontFamily: 'Outfit-SemiBold' },
  contactPhone: { fontSize: 13, fontFamily: 'Outfit-Regular', marginTop: 2 },
  contactEmpty: { textAlign: 'center', fontSize: 14, fontFamily: 'Outfit-Regular', paddingVertical: 32 },
});
