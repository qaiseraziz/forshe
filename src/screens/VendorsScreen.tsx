import React, { useCallback, useMemo, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
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
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import * as Haptics from 'expo-haptics';
import * as Contacts from 'expo-contacts';
import { useData } from '../context/DataContext';
import { Toast, useToast } from '../components/ui/Toast';
import { VENDOR_CATS } from '../constants/data';
import { Vendor, VendorCategory } from '../types';
import { SwipeableRow } from '../components/ui/SwipeableRow';
import { SkeletonCardRow } from '../components/ui/Skeleton';
import {
  hennaColors,
  hennaFonts,
  hennaGradients,
  hennaRadii,
  hennaShadows,
  hennaTextStyles,
} from '../constants/hennaTokens';
import {
  HennaHeader,
  HennaButton,
  HennaCard,
  HennaIcon,
  HennaInput,
  HennaBadge,
  HennaPill,
  ArabesqueCorner,
  MarginMark,
  MeshOverlay,
} from '../components/henna';
import type { HennaIconName } from '../components/henna';

type FilterKey = 'all' | 'favorites' | VendorCategory;

const VENDOR_ICON_MAP: Record<string, HennaIconName> = {
  Plumber: 'wrench',
  Electrician: 'bolt',
  'AC Repair': 'snow',
  'Appliance Repair': 'wrench',
  Doctor: 'doctor',
  Pharmacy: 'pill',
  Tailor: 'tailor',
  Carpenter: 'hammer',
  Gardener: 'leaf',
  Cleaner: 'broom',
  Mechanic: 'car',
  Other: 'list',
};

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
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { vendors, setVendors, allLoaded } = useData();
  const { toast, show: showToast, dismiss: dismissToast } = useToast();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const [fName, setFName] = useState('');
  const [fCategory, setFCategory] = useState<VendorCategory>('Plumber');
  const [fPhone, setFPhone] = useState('');
  const [fAltPhone, setFAltPhone] = useState('');
  const [fAddress, setFAddress] = useState('');
  const [fRating, setFRating] = useState(0);
  const [fFavorite, setFFavorite] = useState(false);
  const [fNotes, setFNotes] = useState('');

  type DeviceContact = { id: string; name: string; phones: string[] };
  const [contactsModalOpen, setContactsModalOpen] = useState(false);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactsList, setContactsList] = useState<DeviceContact[]>([]);
  const [contactsSearch, setContactsSearch] = useState('');

  const vNameRef = useRef<TextInput | null>(null);
  const vPhoneRef = useRef<TextInput | null>(null);
  const vAltPhoneRef = useRef<TextInput | null>(null);
  const vAddressRef = useRef<TextInput | null>(null);
  const vNotesRef = useRef<TextInput | null>(null);

  const onMenu = useCallback(() => {
    Haptics.selectionAsync();
    navigation.dispatch(DrawerActions.openDrawer());
  }, [navigation]);

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

  const openContactPicker = useCallback(async () => {
    setContactsLoading(true);
    setContactsSearch('');
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission needed',
          'Please allow contact access in your device settings.',
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
    return contactsList.filter(
      c =>
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
    Alert.alert('Delete vendor', `Remove "${target.name}"?`, [
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

  const handleCallLong = useCallback((vendor: Vendor) => {
    if (vendor.altPhone) {
      Alert.alert('Call ' + vendor.name, 'Choose which number to call', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Primary: ' + vendor.phone, onPress: () => placeCall(vendor.phone, vendor.id) },
        { text: 'Alt: ' + vendor.altPhone, onPress: () => placeCall(vendor.altPhone!, vendor.id) },
      ]);
    } else {
      placeCall(vendor.phone, vendor.id);
    }
  }, [placeCall]);

  const handleCallPress = useCallback((vendor: Vendor) => {
    placeCall(vendor.phone, vendor.id);
  }, [placeCall]);

  const handleWhatsApp = useCallback((vendor: Vendor) => {
    const clean = cleanPhone(vendor.phone);
    Linking.openURL('https://wa.me/' + clean).catch(() => {
      Alert.alert('Unable to open WhatsApp', 'Could not open WhatsApp for this number.');
    });
    stampUsed(vendor.id);
  }, [stampUsed]);

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
    return vendors
      .filter(v => {
        if (filter === 'all') return true;
        if (filter === 'favorites') return v.favorite;
        return v.category === filter;
      })
      .filter(v => {
        if (!q) return true;
        return v.name.toLowerCase().includes(q) || v.category.toLowerCase().includes(q);
      })
      .sort((a, b) => {
        if (a.favorite !== b.favorite) return a.favorite ? -1 : 1;
        if (a.lastUsed && b.lastUsed) {
          if (a.lastUsed !== b.lastUsed) return a.lastUsed < b.lastUsed ? 1 : -1;
        } else if (a.lastUsed) {
          return -1;
        } else if (b.lastUsed) {
          return 1;
        }
        return a.name.localeCompare(b.name);
      });
  }, [vendors, search, filter]);

  const filterPills = useMemo(() => {
    const pills: { key: FilterKey; label: string; icon?: HennaIconName }[] = [
      { key: 'all', label: 'All' },
    ];
    if (favoritesCount > 0) {
      pills.push({ key: 'favorites', label: 'Favorites', icon: 'star' });
    }
    for (const c of VENDOR_CATS) {
      if (categoryCounts[c.key] && categoryCounts[c.key] > 0) {
        pills.push({ key: c.key, label: c.label, icon: VENDOR_ICON_MAP[c.key] });
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
    return (
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map(n => (
          <HennaIcon
            key={n}
            name="star"
            size={11}
            color={n <= rating ? hennaColors.bronze : hennaColors.line}
          />
        ))}
      </View>
    );
  }, []);

  const renderVendorItem: ListRenderItem<Vendor> = useCallback(({ item }) => {
    const isExpanded = expandedId === item.id;
    const icon = VENDOR_ICON_MAP[item.category] || 'list';
    return (
      <SwipeableRow
        itemLabel={item.name}
        actions={[
          { kind: 'call', onPress: () => handleCallPress(item) },
          { kind: 'delete', onPress: () => deleteVendor(item.id) },
        ]}
      >
        <HennaCard padding={16} style={{ marginBottom: 10 }} onPress={() => toggleExpanded(item.id)}>
          <View style={styles.vendorRow}>
            <View style={styles.iconCircle}>
              <HennaIcon name={icon} size={18} color={hennaColors.henna} />
            </View>
            <View style={styles.vendorContent}>
              <View style={styles.vendorTopRow}>
                <Text style={styles.vendorName} numberOfLines={1}>{item.name}</Text>
                {item.favorite ? <HennaBadge accent="bronze">pinned</HennaBadge> : null}
              </View>
              <Text style={styles.vendorCat}>{item.category}</Text>
              <Text style={styles.vendorPhone} numberOfLines={1}>{item.phone}</Text>
              {renderStars(item.rating)}
              {item.lastUsed ? (
                <Text style={styles.lastUsed}>Last contacted {item.lastUsed}</Text>
              ) : null}
            </View>
            <Pressable
              onPress={() => toggleFavorite(item.id)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={(item.favorite ? 'Unpin ' : 'Pin ') + item.name}
              style={styles.favBtn}
            >
              <HennaIcon
                name="star"
                size={20}
                color={item.favorite ? hennaColors.bronze : hennaColors.muted}
              />
            </Pressable>
          </View>

          {isExpanded && (
            <View style={styles.expandedWrap}>
              {item.address ? (
                <Text style={styles.expandedText}>{item.address}</Text>
              ) : null}
              {item.notes ? (
                <Text style={styles.expandedText}>{item.notes}</Text>
              ) : null}
              <View style={styles.actionsRow}>
                <Pressable
                  onPress={() => handleCallPress(item)}
                  onLongPress={() => handleCallLong(item)}
                  delayLongPress={350}
                  style={[styles.actionBtn, { backgroundColor: hennaColors.hennaBg }]}
                  accessibilityRole="button"
                  accessibilityLabel={'Call ' + item.name}
                >
                  <HennaIcon name="phone" size={14} color={hennaColors.henna} />
                  <Text style={[styles.actionBtnText, { color: hennaColors.henna }]}>Call</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleWhatsApp(item)}
                  style={[styles.actionBtn, { backgroundColor: hennaColors.sageBg }]}
                  accessibilityRole="button"
                  accessibilityLabel={'WhatsApp ' + item.name}
                >
                  <HennaIcon name="message" size={14} color={hennaColors.sage} />
                  <Text style={[styles.actionBtnText, { color: hennaColors.sage }]}>WhatsApp</Text>
                </Pressable>
                <Pressable
                  onPress={() => openEdit(item)}
                  style={[styles.actionBtn, { backgroundColor: hennaColors.paper2 }]}
                  accessibilityRole="button"
                  accessibilityLabel={'Edit ' + item.name}
                >
                  <HennaIcon name="pencil" size={14} color={hennaColors.ink2} />
                </Pressable>
                <Pressable
                  onPress={() => deleteVendor(item.id)}
                  style={[styles.actionBtn, { backgroundColor: hennaColors.hennaBg }]}
                  accessibilityRole="button"
                  accessibilityLabel={'Delete ' + item.name}
                >
                  <HennaIcon name="trash" size={14} color={hennaColors.henna} />
                </Pressable>
              </View>
            </View>
          )}
        </HennaCard>
      </SwipeableRow>
    );
  }, [expandedId, toggleExpanded, toggleFavorite, handleCallLong, handleCallPress, handleWhatsApp, openEdit, deleteVendor, renderStars]);

  const listHeader = useMemo(
    () => (
      <View>
        <HennaHeader
          title="Vendors"
          subtitle={
            vendors.length === 0
              ? 'No vendors saved'
              : `${vendors.length} trusted ${vendors.length === 1 ? 'contact' : 'contacts'}`
          }
          onMenu={onMenu}
        />

        <View style={styles.heroWrap}>
          <View style={styles.heroCard}>
            <LinearGradient
              colors={hennaGradients.heroHenna}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <MeshOverlay />
            <View style={styles.heroCorner} pointerEvents="none">
              <ArabesqueCorner size={110} color={hennaColors.henna} opacity={0.14} />
            </View>
            <View style={styles.heroInner}>
              <View style={styles.greetRow}>
                <MarginMark color={hennaColors.henna} />
                <Text style={[hennaTextStyles.eyebrow, { color: hennaColors.henna }]}>
                  Your rolodex
                </Text>
              </View>
              <Text style={styles.heroNum}>{vendors.length}</Text>
              <Text style={styles.heroSub}>Plumbers, doctors, anyone you trust</Text>
              <View style={{ marginTop: 14 }}>
                <HennaButton title="+ Add vendor" icon="plus" variant="primary" size="sm" onPress={openAdd} />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.searchRow}>
          <HennaInput
            icon="search"
            placeholder="Search vendors"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsRail}>
          {filterPills.map(p => (
            <HennaPill
              key={String(p.key)}
              label={p.label}
              icon={p.icon}
              active={filter === p.key}
              onPress={() => setFilter(p.key)}
            />
          ))}
        </ScrollView>

        <Text style={[hennaTextStyles.eyebrow, styles.sectionEyebrow]}>
          Contacts · {filtered.length}
        </Text>
      </View>
    ),
    [vendors.length, search, openAdd, filterPills, filter, filtered.length, onMenu],
  );

  const listEmpty = useMemo(() => {
    if (!allLoaded) {
      return (
        <View style={{ paddingHorizontal: 16 }}>
          <SkeletonCardRow />
          <SkeletonCardRow />
          <SkeletonCardRow />
        </View>
      );
    }
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyTitle}>
          {vendors.length === 0 ? 'No vendors saved yet.' : 'No vendors match this filter.'}
        </Text>
        <Text style={styles.emptyHint}>
          {vendors.length === 0 ? 'Tap + to save a plumber, doctor, or anyone you rely on.' : ''}
        </Text>
      </View>
    );
  }, [vendors.length, allLoaded]);

  return (
    <View style={styles.container}>
      <LinearGradient colors={hennaGradients.page} style={StyleSheet.absoluteFill} />
      <FlatList
        data={filtered}
        keyExtractor={keyExtractor}
        renderItem={renderVendorItem}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top, paddingBottom: 180, paddingHorizontal: 16 }]}
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
          <View style={styles.modalBox}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={styles.modalTitle}>{editingId !== null ? 'Edit vendor' : 'Add vendor'}</Text>

              {editingId === null && (
                <Pressable
                  onPress={openContactPicker}
                  disabled={contactsLoading}
                  style={styles.contactsCta}
                  accessibilityRole="button"
                  accessibilityLabel="Pick from contacts"
                >
                  <HennaIcon name="message" size={20} color={hennaColors.plum} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.contactsCtaTitle}>
                      {contactsLoading ? 'Loading…' : 'Pick from Contacts'}
                    </Text>
                    <Text style={styles.contactsCtaSub}>Pre-fill name + phone</Text>
                  </View>
                  <HennaIcon name="chev-right" size={14} color={hennaColors.plum} />
                </Pressable>
              )}

              <HennaInput
                ref={vNameRef}
                label="Name"
                placeholder="e.g. Ali Plumbing"
                value={fName}
                onChangeText={setFName}
                containerStyle={{ marginBottom: 12 }}
                autoFocus={editingId !== null}
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => vPhoneRef.current?.focus()}
              />

              <Text style={[hennaTextStyles.eyebrow, { marginBottom: 8 }]}>Category</Text>
              <View style={styles.pickerWrap}>
                <Picker
                  selectedValue={fCategory}
                  onValueChange={v => setFCategory(v)}
                  style={{ color: hennaColors.ink }}
                  dropdownIconColor={hennaColors.muted}
                >
                  {VENDOR_CATS.map(c => (
                    <Picker.Item key={c.key} value={c.key} label={c.label} />
                  ))}
                </Picker>
              </View>

              <HennaInput
                ref={vPhoneRef}
                label="Phone"
                placeholder="e.g. 0300 1234567"
                value={fPhone}
                onChangeText={setFPhone}
                keyboardType="phone-pad"
                containerStyle={{ marginTop: 12 }}
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => vAltPhoneRef.current?.focus()}
              />

              <HennaInput
                ref={vAltPhoneRef}
                label="Alt phone (optional)"
                placeholder="e.g. 021 1234567"
                value={fAltPhone}
                onChangeText={setFAltPhone}
                keyboardType="phone-pad"
                containerStyle={{ marginTop: 12 }}
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => vAddressRef.current?.focus()}
              />

              <HennaInput
                ref={vAddressRef}
                label="Address (optional)"
                placeholder="Shop, street, area"
                value={fAddress}
                onChangeText={setFAddress}
                multiline
                containerStyle={{ marginTop: 12 }}
              />

              <Text style={[hennaTextStyles.eyebrow, { marginTop: 14, marginBottom: 8 }]}>Rating</Text>
              <View style={styles.ratingRow}>
                {[1, 2, 3, 4, 5].map(n => (
                  <Pressable
                    key={n}
                    onPress={() => setRating(n)}
                    style={styles.starBtn}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={`${n} star${n > 1 ? 's' : ''}`}
                  >
                    <HennaIcon
                      name="star"
                      size={24}
                      color={n <= fRating ? hennaColors.bronze : hennaColors.line}
                    />
                  </Pressable>
                ))}
              </View>

              <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.switchTitle}>Pin as favorite</Text>
                  <Text style={styles.switchSub}>Show at the top of the list</Text>
                </View>
                <Switch
                  value={fFavorite}
                  onValueChange={setFFavorite}
                  trackColor={{ false: hennaColors.line, true: hennaColors.bronze }}
                  thumbColor={hennaColors.paper}
                />
              </View>

              <HennaInput
                ref={vNotesRef}
                label="Notes (optional)"
                placeholder="e.g. Fair prices, reliable"
                value={fNotes}
                onChangeText={setFNotes}
                multiline
                containerStyle={{ marginTop: 12 }}
                returnKeyType="done"
                onSubmitEditing={saveVendor}
              />

              <View style={styles.modalBtns}>
                <HennaButton title="Cancel" variant="outline" onPress={closeModal} style={{ flex: 1 }} />
                <HennaButton title={editingId !== null ? 'Save' : 'Add'} variant="primary" onPress={saveVendor} style={{ flex: 1 }} />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Contact picker modal */}
      <Modal
        visible={contactsModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setContactsModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pick a contact</Text>
              <Pressable onPress={() => setContactsModalOpen(false)} hitSlop={8} accessibilityLabel="Close">
                <HennaIcon name="close" size={18} color={hennaColors.muted} />
              </Pressable>
            </View>
            <HennaInput
              icon="search"
              placeholder="Search name or number"
              value={contactsSearch}
              onChangeText={setContactsSearch}
              containerStyle={{ marginBottom: 12 }}
            />
            <FlatList
              data={filteredContacts}
              keyExtractor={c => c.id}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => pickContact(item)}
                  style={styles.contactRow}
                  accessibilityRole="button"
                  accessibilityLabel={`Pick ${item.name}`}
                >
                  <View style={styles.contactAvatar}>
                    <Text style={styles.contactAvatarText}>
                      {item.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.contactName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.contactPhone} numberOfLines={1}>
                      {item.phones[0]}
                      {item.phones.length > 1 ? ` · +${item.phones.length - 1} more` : ''}
                    </Text>
                  </View>
                  <HennaIcon name="chev-right" size={14} color={hennaColors.muted} />
                </Pressable>
              )}
              ListEmptyComponent={
                <Text style={styles.contactEmpty}>
                  {contactsSearch.trim()
                    ? 'No contacts match.'
                    : 'No phone-bearing contacts found.'}
                </Text>
              }
            />
          </View>
        </View>
      </Modal>

      <Toast toast={toast} dismiss={dismissToast} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 180 },

  heroWrap: { paddingHorizontal: 0 },
  heroCard: {
    borderRadius: hennaRadii.card,
    overflow: 'hidden',
    position: 'relative',
    ...hennaShadows.md,
  },
  heroCorner: { position: 'absolute', top: -6, right: -6 },
  heroInner: { paddingVertical: 22, paddingHorizontal: 24, position: 'relative' },
  greetRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroNum: {
    marginTop: 8,
    fontFamily: hennaFonts.serif,
    fontSize: 42,
    color: hennaColors.ink,
    letterSpacing: -0.5,
  },
  heroSub: { marginTop: 6, fontFamily: hennaFonts.ui, fontSize: 12, color: hennaColors.ink2 },

  searchRow: { paddingTop: 18 },
  pillsRail: { paddingTop: 12, gap: 6 },
  sectionEyebrow: { paddingHorizontal: 8, paddingTop: 18, paddingBottom: 10 },

  emptyWrap: { paddingHorizontal: 24, paddingVertical: 32, alignItems: 'center' },
  emptyTitle: { fontFamily: hennaFonts.serif, fontSize: 18, color: hennaColors.ink, textAlign: 'center' },
  emptyHint: { marginTop: 8, fontFamily: hennaFonts.ui, fontSize: 12, color: hennaColors.muted, textAlign: 'center' },

  vendorRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: hennaColors.hennaBg,
  },
  vendorContent: { flex: 1, minWidth: 0 },
  vendorTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  vendorName: { flex: 1, fontFamily: hennaFonts.uiSemi, fontSize: 14, color: hennaColors.ink },
  vendorCat: { fontFamily: hennaFonts.ui, fontSize: 11, color: hennaColors.muted, marginBottom: 2 },
  vendorPhone: { fontFamily: hennaFonts.uiSemi, fontSize: 13, color: hennaColors.ink2 },
  starsRow: { flexDirection: 'row', gap: 2, marginTop: 4 },
  lastUsed: { fontFamily: hennaFonts.ui, fontSize: 10, color: hennaColors.muted, marginTop: 4 },
  favBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  expandedWrap: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: hennaColors.line,
  },
  expandedText: { marginBottom: 6, fontFamily: hennaFonts.ui, fontSize: 12, color: hennaColors.ink2 },
  actionsRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  actionBtn: {
    flex: 1,
    minHeight: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    flexDirection: 'row',
    gap: 4,
  },
  actionBtnText: { fontFamily: hennaFonts.uiSemi, fontSize: 12 },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(60,40,20,0.45)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: hennaColors.pearl,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '88%',
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  modalTitle: { fontFamily: hennaFonts.serif, fontSize: 20, color: hennaColors.ink, marginBottom: 16 },
  contactsCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: hennaColors.plumBg,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  contactsCtaTitle: { fontFamily: hennaFonts.uiSemi, fontSize: 14, color: hennaColors.plum },
  contactsCtaSub: { marginTop: 2, fontFamily: hennaFonts.ui, fontSize: 11, color: hennaColors.muted },
  pickerWrap: {
    backgroundColor: hennaColors.paper2,
    borderRadius: hennaRadii.input,
    borderWidth: 1,
    borderColor: hennaColors.line,
    overflow: 'hidden',
    minHeight: 50,
    justifyContent: 'center',
  },
  ratingRow: { flexDirection: 'row', gap: 4 },
  starBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  switchTitle: { fontFamily: hennaFonts.uiSemi, fontSize: 14, color: hennaColors.ink },
  switchSub: { marginTop: 2, fontFamily: hennaFonts.ui, fontSize: 11, color: hennaColors.muted },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 18 },

  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: hennaColors.paper,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: hennaColors.line,
  },
  contactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: hennaColors.plumBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactAvatarText: { fontFamily: hennaFonts.uiSemi, fontSize: 16, color: hennaColors.plum },
  contactName: { fontFamily: hennaFonts.uiSemi, fontSize: 14, color: hennaColors.ink },
  contactPhone: { marginTop: 2, fontFamily: hennaFonts.ui, fontSize: 12, color: hennaColors.muted },
  contactEmpty: { textAlign: 'center', fontFamily: hennaFonts.ui, fontSize: 12, color: hennaColors.muted, paddingVertical: 32 },
});
