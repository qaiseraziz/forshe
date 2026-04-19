import React, { useCallback, useMemo, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import * as Haptics from 'expo-haptics';
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
import { INVENTORY_CATS, UNIT_HINTS } from '../constants/data';
import { InventoryItem, InventoryCategory } from '../types';
import { SwipeableRow } from '../components/ui/SwipeableRow';
import { SkeletonCardRow } from '../components/ui/Skeleton';

export default function InventoryScreen() {
  const { colors, dark } = useTheme();
  const insets = useSafeAreaInsets();
  const { inventory, setInventory, allLoaded } = useData();
  const { toast, show: showToast, dismiss: dismissToast } = useToast();

  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<InventoryCategory | 'all'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form state
  const [fName, setFName] = useState('');
  const [fQty, setFQty] = useState('');
  const [fUnit, setFUnit] = useState('kg');
  const [fCat, setFCat] = useState<InventoryCategory>('Grocery');
  const [fThresh, setFThresh] = useState('1');
  const [fNotes, setFNotes] = useState('');

  // v1.2.5-dev: keyboard flow refs for the Add/Edit modal.
  const iNameRef = useRef<TextInput | null>(null);
  const iQtyRef = useRef<TextInput | null>(null);
  const iUnitRef = useRef<TextInput | null>(null);
  const iThreshRef = useRef<TextInput | null>(null);
  const iNotesRef = useRef<TextInput | null>(null);

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
          ? { ...i, name: fName.trim(), qty, unit: fUnit.trim() || 'pcs', category: fCat, lowStockThreshold: thresh, notes: fNotes.trim() || undefined, lastUpdated: now }
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
    Alert.alert('Delete Item', `Remove "${target.name}" from inventory?`, [
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
    <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.container}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <Card gradient={dark ? gradients.greenHeroDark : gradients.greenHero}>
          <View style={styles.heroHeaderRow}>
            <DrawerMenuButton />
            <View style={styles.heroHeaderText}>
              <Text style={[styles.heroLabel, { color: colors.green }]}>📦 Inventory</Text>
              <Text style={[styles.heroNum, { color: colors.green }]}>{inventory.length}</Text>
              <Text style={[styles.heroSub, { color: colors.sub }]}>
                {lowStockCount > 0
                  ? `${lowStockCount} low on stock`
                  : inventory.length === 0
                    ? 'Nothing tracked yet'
                    : 'All well stocked'}
              </Text>
            </View>
          </View>
        </Card>

        {/* Search + Add */}
        <View style={styles.searchRow}>
          <View style={{ flex: 1 }}>
            <Input placeholder="Search inventory…" value={search} onChangeText={setSearch} />
          </View>
          <Button title="+ Add" variant="green" onPress={openAdd} />
        </View>

        {/* Category filter pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catPills}>
          <TouchableOpacity
            style={[styles.pill, { backgroundColor: filterCat === 'all' ? colors.greenBg : colors.bg3 }]}
            onPress={() => setFilterCat('all')}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.pillText, { color: filterCat === 'all' ? colors.green : colors.sub }]}>All</Text>
          </TouchableOpacity>
          {INVENTORY_CATS.map(c => (
            <TouchableOpacity
              key={c.key}
              style={[styles.pill, { backgroundColor: filterCat === c.key ? colors.greenBg : colors.bg3 }]}
              onPress={() => setFilterCat(c.key)}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={[styles.pillText, { color: filterCat === c.key ? colors.green : colors.sub }]}>
                {c.icon} {c.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Divider label={`Items · ${filtered.length}`} />

        {!allLoaded && (
          <>
            <SkeletonCardRow />
            <SkeletonCardRow />
            <SkeletonCardRow />
            <SkeletonCardRow />
          </>
        )}
        {allLoaded && filtered.length === 0 ? (
          <EmptyState
            icon="📦"
            text={inventory.length === 0
              ? 'Your pantry is empty. Add items to track what you have.'
              : 'No items match this filter.'}
            hint={inventory.length === 0 ? 'Tap + Add to log your first item.' : undefined}
          />
        ) : allLoaded ? filtered.map(item => {
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
            <Card>
              <View style={styles.itemRow}>
                <View style={styles.itemIconWrap}>
                  <Text style={styles.itemIcon}>{catDef?.icon || '📦'}</Text>
                </View>
                <View style={styles.itemContent}>
                  <View style={styles.itemTopRow}>
                    <Text style={[styles.itemName, { color: colors.deep }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    {isLow && (
                      <Badge text="Low" bg={colors.redBg} color={colors.red} />
                    )}
                  </View>
                  <Text style={[styles.itemQty, { color: isLow ? colors.red : colors.sub }]}>
                    {item.qty} {item.unit}
                  </Text>
                  <Text style={[styles.itemMeta, { color: colors.muted }]}>
                    {catDef?.label || item.category} · Threshold: {item.lowStockThreshold} {item.unit}
                  </Text>
                  {item.notes ? (
                    <Text style={[styles.itemNotes, { color: colors.muted }]} numberOfLines={2}>
                      {item.notes}
                    </Text>
                  ) : null}
                </View>
              </View>

              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={[styles.qtyBtn, { backgroundColor: colors.bg3 }]}
                  onPress={() => adjustQty(item.id, -1)}
                  accessibilityLabel={`Decrease ${item.name}`}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={[styles.qtyBtnText, { color: colors.deep }]}>−</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.qtyBtn, { backgroundColor: colors.bg3 }]}
                  onPress={() => adjustQty(item.id, 1)}
                  accessibilityLabel={`Increase ${item.name}`}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={[styles.qtyBtnText, { color: colors.deep }]}>+</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.editBtn, { backgroundColor: colors.bg3 }]}
                  onPress={() => openEdit(item)}
                  accessibilityLabel={`Edit ${item.name}`}
                >
                  <Text style={[styles.editBtnText, { color: colors.sub }]}>✏️ Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.editBtn, { backgroundColor: colors.redBg }]}
                  onPress={() => deleteItem(item.id)}
                  accessibilityLabel={`Delete ${item.name}`}
                >
                  <Text style={[styles.editBtnText, { color: colors.red }]}>🗑</Text>
                </TouchableOpacity>
              </View>
            </Card>
            </SwipeableRow>
          );
        }) : null}

        <View style={styles.bottomPad} />
      </ScrollView>

      {/* Add / Edit Modal */}
      <Modal visible={modalOpen} transparent animationType="slide" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.bg2 }]}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={[styles.modalTitle, { color: colors.deep }]}>
                {editingId !== null ? 'Edit Item' : 'Add to Inventory'}
              </Text>

              <Input
                ref={iNameRef}
                label="Name"
                placeholder="e.g. Basmati Rice"
                value={fName}
                onChangeText={setFName}
                style={{ marginBottom: 12 }}
                autoFocus
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => iQtyRef.current?.focus()}
              />

              <View style={styles.qtyRow}>
                <View style={{ flex: 1 }}>
                  <Input
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
                  <Input
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

              {/* Quick unit hints */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10, marginBottom: 12 }}>
                {UNIT_HINTS.map(u => (
                  <TouchableOpacity
                    key={u}
                    style={[styles.unitHint, { backgroundColor: fUnit === u ? colors.greenBg : colors.bg3 }]}
                    onPress={() => setFUnit(u)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={[styles.unitHintText, { color: fUnit === u ? colors.green : colors.sub }]}>{u}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={[styles.fieldLabel, { color: colors.muted }]}>CATEGORY</Text>
              <View style={[styles.pickerWrap, { backgroundColor: colors.bg3 }]}>
                <Picker
                  selectedValue={fCat}
                  onValueChange={v => setFCat(v)}
                  style={{ color: colors.text }}
                  dropdownIconColor={colors.muted}
                >
                  {INVENTORY_CATS.map(c => (
                    <Picker.Item key={c.key} value={c.key} label={`${c.icon}  ${c.label}`} />
                  ))}
                </Picker>
              </View>

              <Input
                ref={iThreshRef}
                label="Low-stock threshold"
                placeholder="1"
                value={fThresh}
                onChangeText={setFThresh}
                keyboardType="numeric"
                style={{ marginBottom: 12 }}
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => iNotesRef.current?.focus()}
              />
              <Input
                ref={iNotesRef}
                label="Notes (optional)"
                placeholder="e.g. expires next week"
                value={fNotes}
                onChangeText={setFNotes}
                multiline
                returnKeyType="done"
                onSubmitEditing={saveItem}
              />

              <View style={styles.modalBtns}>
                <Button title="Cancel" variant="outline" small onPress={closeModal} style={{ flex: 1 }} />
                <Button title={editingId !== null ? 'Save' : 'Add'} variant="green" small onPress={saveItem} style={{ flex: 1 }} />
              </View>
            </ScrollView>
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
  catPills: { flexGrow: 0, marginBottom: 8 },
  pill: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, marginRight: 8, minHeight: 44, justifyContent: 'center' },
  pillText: { fontSize: 13, fontFamily: 'Outfit-SemiBold' },
  itemRow: { flexDirection: 'row', gap: 12 },
  itemIconWrap: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(26,138,90,0.08)' },
  itemIcon: { fontSize: 22 },
  itemContent: { flex: 1, minWidth: 0 },
  itemTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 },
  itemName: { fontFamily: 'Outfit-SemiBold', fontSize: 16, flexShrink: 1 },
  itemQty: { fontFamily: 'Outfit-Bold', fontSize: 15 },
  itemMeta: { fontSize: 12, fontFamily: 'Outfit-Regular', marginTop: 2 },
  itemNotes: { fontSize: 12, fontFamily: 'Outfit-Regular', marginTop: 4, fontStyle: 'italic' },
  actionsRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  qtyBtn: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  qtyBtnText: { fontSize: 20, fontFamily: 'Outfit-Bold' },
  editBtn: { flex: 1, minHeight: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  editBtnText: { fontSize: 13, fontFamily: 'Outfit-SemiBold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalBox: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: '88%' },
  modalTitle: { fontSize: 22, fontFamily: 'PlayfairDisplay-Bold', marginBottom: 18 },
  qtyRow: { flexDirection: 'row', gap: 10 },
  fieldLabel: { fontSize: 12, fontFamily: 'Outfit-Bold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  pickerWrap: { borderRadius: 16, overflow: 'hidden', marginBottom: 12 },
  unitHint: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, marginRight: 8, minHeight: 44, justifyContent: 'center' },
  unitHintText: { fontSize: 13, fontFamily: 'Outfit-SemiBold' },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 18, marginBottom: 12 },
  bottomPad: { height: 40 },
});
