import React, { useCallback, useMemo, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Modal,
  Alert,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import * as Haptics from 'expo-haptics';
import { useData } from '../context/DataContext';
import { Toast, useToast } from '../components/ui/Toast';
import { INVENTORY_CATS, UNIT_HINTS } from '../constants/data';
import { InventoryItem, InventoryCategory } from '../types';
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

const CAT_ICONS: Record<InventoryCategory, HennaIconName> = {
  Grocery: 'cart',
  Household: 'house',
  Pantry: 'pot',
  Fridge: 'snow',
  Freezer: 'snow',
};

export default function InventoryScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { inventory, setInventory, allLoaded } = useData();
  const { toast, show: showToast, dismiss: dismissToast } = useToast();

  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<InventoryCategory | 'all'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [fName, setFName] = useState('');
  const [fQty, setFQty] = useState('');
  const [fUnit, setFUnit] = useState('kg');
  const [fCat, setFCat] = useState<InventoryCategory>('Grocery');
  const [fThresh, setFThresh] = useState('1');
  const [fNotes, setFNotes] = useState('');

  const iNameRef = useRef<TextInput | null>(null);
  const iQtyRef = useRef<TextInput | null>(null);
  const iUnitRef = useRef<TextInput | null>(null);
  const iThreshRef = useRef<TextInput | null>(null);
  const iNotesRef = useRef<TextInput | null>(null);

  const onMenu = useCallback(() => {
    Haptics.selectionAsync();
    navigation.dispatch(DrawerActions.openDrawer());
  }, [navigation]);

  const resetForm = useCallback(() => {
    setFName('');
    setFQty('');
    setFUnit('kg');
    setFCat('Grocery');
    setFThresh('1');
    setFNotes('');
    setEditingId(null);
  }, []);

  const openAdd = useCallback(() => {
    resetForm();
    setModalOpen(true);
  }, [resetForm]);

  const openEdit = useCallback((item: InventoryItem) => {
    setEditingId(item.id);
    setFName(item.name);
    setFQty(String(item.qty));
    setFUnit(item.unit);
    setFCat(item.category);
    setFThresh(String(item.lowStockThreshold));
    setFNotes(item.notes || '');
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    resetForm();
  }, [resetForm]);

  const saveItem = useCallback(() => {
    if (!fName.trim()) {
      Alert.alert('Missing name', 'Please enter an item name.');
      return;
    }
    const qty = parseFloat(fQty);
    if (isNaN(qty) || qty < 0) {
      Alert.alert('Invalid quantity', 'Quantity must be zero or a positive number.');
      return;
    }
    const thresh = parseFloat(fThresh);
    if (isNaN(thresh) || thresh < 0) {
      Alert.alert('Invalid threshold', 'Low-stock threshold must be zero or positive.');
      return;
    }

    const now = new Date().toISOString();
    if (editingId !== null) {
      setInventory(prev => prev.map(i =>
        i.id === editingId
          ? {
              ...i,
              name: fName.trim(),
              qty,
              unit: fUnit.trim() || 'pcs',
              category: fCat,
              lowStockThreshold: thresh,
              notes: fNotes.trim() || undefined,
              lastUpdated: now,
            }
          : i,
      ));
      showToast('Item updated');
    } else {
      const item: InventoryItem = {
        id: Date.now(),
        name: fName.trim(),
        qty,
        unit: fUnit.trim() || 'pcs',
        category: fCat,
        lowStockThreshold: thresh,
        lastUpdated: now,
        notes: fNotes.trim() || undefined,
      };
      setInventory(prev => [item, ...prev]);
      showToast('Item added');
    }
    Haptics.selectionAsync();
    closeModal();
  }, [fName, fQty, fUnit, fCat, fThresh, fNotes, editingId, setInventory, showToast, closeModal]);

  const deleteItem = useCallback((id: number) => {
    const target = inventory.find(i => i.id === id);
    if (!target) return;
    Alert.alert('Delete item', `Remove "${target.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setInventory(prev => prev.filter(i => i.id !== id));
          Haptics.selectionAsync();
          showToast(target.name + ' deleted', () => {
            setInventory(prev => [target, ...prev]);
          });
        },
      },
    ]);
  }, [inventory, setInventory, showToast]);

  const adjustQty = useCallback((id: number, delta: number) => {
    setInventory(prev => prev.map(i => {
      if (i.id !== id) return i;
      const next = Math.max(0, i.qty + delta);
      return { ...i, qty: next, lastUpdated: new Date().toISOString() };
    }));
    Haptics.selectionAsync();
  }, [setInventory]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return inventory
      .filter(i => filterCat === 'all' || i.category === filterCat)
      .filter(i => !q || i.name.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [inventory, search, filterCat]);

  const lowStockCount = useMemo(
    () => inventory.filter(i => i.qty <= i.lowStockThreshold).length,
    [inventory],
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={hennaGradients.page} style={StyleSheet.absoluteFill} />
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top, paddingBottom: 180 }]}
        showsVerticalScrollIndicator={false}
      >
        <HennaHeader
          title="Inventory"
          subtitle={
            inventory.length === 0
              ? 'Nothing tracked yet'
              : lowStockCount > 0
                ? `${lowStockCount} low on stock`
                : 'All well stocked'
          }
          onMenu={onMenu}
        />

        {/* Hero — sage */}
        <View style={styles.heroWrap}>
          <View style={styles.heroCard}>
            <LinearGradient
              colors={hennaGradients.heroSage}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <MeshOverlay />
            <View style={styles.heroCorner} pointerEvents="none">
              <ArabesqueCorner size={110} color={hennaColors.sage} opacity={0.18} />
            </View>
            <View style={styles.heroInner}>
              <View style={styles.greetRow}>
                <MarginMark color={hennaColors.sage} />
                <Text style={[hennaTextStyles.eyebrow, { color: hennaColors.sage }]}>Pantry</Text>
              </View>
              <Text style={styles.heroNum}>{inventory.length}</Text>
              <Text style={styles.heroSub}>
                {lowStockCount > 0 ? `${lowStockCount} need restocking` : 'Items tracked'}
              </Text>
              <View style={{ marginTop: 14 }}>
                <HennaButton title="+ Add item" icon="plus" variant="sage" size="sm" onPress={openAdd} />
              </View>
            </View>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchRow}>
          <HennaInput
            icon="search"
            placeholder="Search inventory"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Category filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsRail}>
          <HennaPill label="All" active={filterCat === 'all'} onPress={() => setFilterCat('all')} />
          {INVENTORY_CATS.map(c => (
            <HennaPill
              key={c.key}
              label={c.label}
              icon={CAT_ICONS[c.key]}
              active={filterCat === c.key}
              onPress={() => setFilterCat(c.key)}
            />
          ))}
        </ScrollView>

        <Text style={[hennaTextStyles.eyebrow, styles.sectionEyebrow]}>
          Items · {filtered.length}
        </Text>

        {!allLoaded && (
          <View style={{ paddingHorizontal: 16 }}>
            <SkeletonCardRow />
            <SkeletonCardRow />
            <SkeletonCardRow />
          </View>
        )}

        {allLoaded && filtered.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>
              {inventory.length === 0 ? 'Pantry is empty.' : 'No matches.'}
            </Text>
            <Text style={styles.emptyHint}>
              {inventory.length === 0 ? 'Tap + to add your first item.' : 'Try a different filter.'}
            </Text>
          </View>
        ) : allLoaded ? (
          <View style={styles.listWrap}>
            {filtered.map(item => {
              const isLow = item.qty <= item.lowStockThreshold;
              const catDef = INVENTORY_CATS.find(c => c.key === item.category);
              return (
                <SwipeableRow
                  key={item.id}
                  itemLabel={item.name}
                  actions={[
                    { kind: 'edit', onPress: () => openEdit(item) },
                    { kind: 'delete', onPress: () => deleteItem(item.id) },
                  ]}
                >
                  <HennaCard padding={16} style={{ marginBottom: 10 }}>
                    <View style={styles.itemRow}>
                      <View style={styles.itemIconWrap}>
                        <HennaIcon name={CAT_ICONS[item.category]} size={18} color={hennaColors.sage} />
                      </View>
                      <View style={styles.itemContent}>
                        <View style={styles.itemTopRow}>
                          <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                          {isLow ? <HennaBadge accent="henna">low</HennaBadge> : null}
                        </View>
                        <Text style={[styles.itemQty, { color: isLow ? hennaColors.henna : hennaColors.ink2 }]}>
                          {item.qty} {item.unit}
                        </Text>
                        <Text style={styles.itemMeta}>
                          {catDef?.label || item.category} · threshold {item.lowStockThreshold} {item.unit}
                        </Text>
                        {item.notes ? (
                          <Text style={styles.itemNotes} numberOfLines={2}>
                            {item.notes}
                          </Text>
                        ) : null}
                      </View>
                    </View>

                    <View style={styles.actionsRow}>
                      <Pressable
                        onPress={() => adjustQty(item.id, -1)}
                        style={styles.qtyBtn}
                        hitSlop={8}
                        accessibilityLabel={`Decrease ${item.name}`}
                      >
                        <Text style={styles.qtyBtnText}>−</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => adjustQty(item.id, 1)}
                        style={styles.qtyBtn}
                        hitSlop={8}
                        accessibilityLabel={`Increase ${item.name}`}
                      >
                        <Text style={styles.qtyBtnText}>+</Text>
                      </Pressable>
                      <View style={{ flex: 1 }} />
                      <HennaButton
                        title="Edit"
                        icon="pencil"
                        variant="outline"
                        size="sm"
                        onPress={() => openEdit(item)}
                      />
                    </View>
                  </HennaCard>
                </SwipeableRow>
              );
            })}
          </View>
        ) : null}
      </ScrollView>

      {/* Add / Edit Modal */}
      <Modal visible={modalOpen} transparent animationType="slide" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={styles.modalTitle}>{editingId !== null ? 'Edit item' : 'Add item'}</Text>

              <HennaInput
                ref={iNameRef}
                label="Name"
                placeholder="e.g. Basmati rice"
                value={fName}
                onChangeText={setFName}
                containerStyle={{ marginBottom: 12 }}
                autoFocus
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => iQtyRef.current?.focus()}
              />

              <View style={styles.qtyRow}>
                <View style={{ flex: 1 }}>
                  <HennaInput
                    ref={iQtyRef}
                    label="Quantity"
                    placeholder="0"
                    value={fQty}
                    onChangeText={setFQty}
                    keyboardType="numeric"
                    returnKeyType="next"
                    blurOnSubmit={false}
                    onSubmitEditing={() => iUnitRef.current?.focus()}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <HennaInput
                    ref={iUnitRef}
                    label="Unit"
                    placeholder="kg / pcs"
                    value={fUnit}
                    onChangeText={setFUnit}
                    returnKeyType="next"
                    blurOnSubmit={false}
                    onSubmitEditing={() => iThreshRef.current?.focus()}
                  />
                </View>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ marginTop: 10, gap: 6 }}
              >
                {UNIT_HINTS.map(u => (
                  <HennaPill key={u} label={u} active={fUnit === u} onPress={() => setFUnit(u)} />
                ))}
              </ScrollView>

              <Text style={[hennaTextStyles.eyebrow, { marginTop: 14, marginBottom: 8 }]}>Category</Text>
              <View style={styles.pickerWrap}>
                <Picker
                  selectedValue={fCat}
                  onValueChange={v => setFCat(v)}
                  style={{ color: hennaColors.ink }}
                  dropdownIconColor={hennaColors.muted}
                >
                  {INVENTORY_CATS.map(c => (
                    <Picker.Item key={c.key} value={c.key} label={c.label} />
                  ))}
                </Picker>
              </View>

              <HennaInput
                ref={iThreshRef}
                label="Low-stock threshold"
                placeholder="1"
                value={fThresh}
                onChangeText={setFThresh}
                keyboardType="numeric"
                containerStyle={{ marginTop: 12 }}
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => iNotesRef.current?.focus()}
              />
              <HennaInput
                ref={iNotesRef}
                label="Notes (optional)"
                placeholder="e.g. expires next week"
                value={fNotes}
                onChangeText={setFNotes}
                multiline
                containerStyle={{ marginTop: 12 }}
                returnKeyType="done"
                onSubmitEditing={saveItem}
              />

              <View style={styles.modalBtns}>
                <HennaButton title="Cancel" variant="outline" onPress={closeModal} style={{ flex: 1 }} />
                <HennaButton title={editingId !== null ? 'Save' : 'Add'} variant="sage" onPress={saveItem} style={{ flex: 1 }} />
              </View>
            </ScrollView>
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

  heroWrap: { paddingHorizontal: 16 },
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

  searchRow: { paddingHorizontal: 16, marginTop: 18 },
  pillsRail: { paddingHorizontal: 16, paddingTop: 12, gap: 6 },
  sectionEyebrow: { paddingHorizontal: 24, paddingTop: 18, paddingBottom: 10 },

  emptyWrap: { paddingHorizontal: 24, paddingVertical: 32, alignItems: 'center' },
  emptyTitle: { fontFamily: hennaFonts.serif, fontSize: 18, color: hennaColors.ink, textAlign: 'center' },
  emptyHint: { marginTop: 8, fontFamily: hennaFonts.ui, fontSize: 12, color: hennaColors.muted, textAlign: 'center' },

  listWrap: { paddingHorizontal: 16 },
  itemRow: { flexDirection: 'row', gap: 12 },
  itemIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: hennaColors.sageBg,
  },
  itemContent: { flex: 1, minWidth: 0 },
  itemTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  itemName: { flex: 1, fontFamily: hennaFonts.uiSemi, fontSize: 14, color: hennaColors.ink },
  itemQty: { fontFamily: hennaFonts.serif, fontSize: 15 },
  itemMeta: { marginTop: 2, fontFamily: hennaFonts.ui, fontSize: 11, color: hennaColors.muted },
  itemNotes: { marginTop: 4, fontFamily: hennaFonts.ui, fontSize: 11, color: hennaColors.muted, fontStyle: 'italic' },
  actionsRow: { flexDirection: 'row', gap: 8, marginTop: 12, alignItems: 'center' },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: hennaColors.paper2,
    borderWidth: 1,
    borderColor: hennaColors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: { fontFamily: hennaFonts.serif, fontSize: 18, color: hennaColors.ink },

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
  modalTitle: { fontFamily: hennaFonts.serif, fontSize: 22, color: hennaColors.ink, marginBottom: 16 },
  qtyRow: { flexDirection: 'row', gap: 10 },
  pickerWrap: {
    backgroundColor: hennaColors.paper2,
    borderRadius: hennaRadii.input,
    borderWidth: 1,
    borderColor: hennaColors.line,
    overflow: 'hidden',
    minHeight: 50,
    justifyContent: 'center',
  },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 18 },
});
