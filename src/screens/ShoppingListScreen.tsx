import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Share,
  LayoutAnimation,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { gradients } from '../constants/colors';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Divider } from '../components/ui/Divider';
import { EmptyState } from '../components/ui/EmptyState';
import { Toast, useToast } from '../components/ui/Toast';
import { DrawerMenuButton } from '../components/DrawerMenuButton';
import { ShoppingItem, ShoppingSession } from '../types';
import { SwipeableRow } from '../components/ui/SwipeableRow';

const QUICK_ADD = ['Milk', 'Bread', 'Eggs', 'Rice', 'Oil', 'Sugar', 'Atta', 'Chicken', 'Onions', 'Tomatoes'];

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function fmtShort(d: Date): string {
  return `${String(d.getDate()).padStart(2, '0')} ${SHORT_MONTHS[d.getMonth()]}`;
}

function fmtShortYear(d: Date): string {
  return `${String(d.getDate()).padStart(2, '0')} ${SHORT_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export default function ShoppingListScreen() {
  const { colors, dark } = useTheme();
  const insets = useSafeAreaInsets();
  const { shoppingSessions, setShoppingSessions } = useData();
  const { toast, show: showToast, dismiss: dismissToast } = useToast();

  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [qtyInput, setQtyInput] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [copyFromId, setCopyFromId] = useState<number | null>(null);

  // Active session
  const activeSession = useMemo(
    () => shoppingSessions.find(s => s.id === activeSessionId) ?? null,
    [shoppingSessions, activeSessionId],
  );

  // Sorted items: unchecked first, then checked
  const sortedItems = useMemo(() => {
    if (!activeSession) return [];
    const unchecked = activeSession.items.filter(i => !i.done);
    const checked = activeSession.items.filter(i => i.done);
    return [...unchecked, ...checked];
  }, [activeSession]);

  // Sessions sorted: active first (newest), completed at bottom
  const sortedSessions = useMemo(() => {
    const active = shoppingSessions.filter(s => !s.completed);
    const completed = shoppingSessions.filter(s => s.completed);
    return [
      ...active.sort((a, b) => b.id - a.id),
      ...completed.sort((a, b) => b.id - a.id),
    ];
  }, [shoppingSessions]);

  // --- Session helpers ---
  const updateSession = useCallback((id: number, updater: (s: ShoppingSession) => ShoppingSession) => {
    setShoppingSessions(prev => prev.map(s => s.id === id ? updater(s) : s));
  }, [setShoppingSessions]);

  const createSession = useCallback((name: string, items: ShoppingItem[]) => {
    const session: ShoppingSession = {
      id: Date.now(),
      name: name || `Shopping ${fmtShort(new Date())}`,
      createdAt: new Date().toISOString(),
      items: items.map(i => ({ ...i, id: Date.now() + Math.random(), done: false })),
      completed: false,
    };
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShoppingSessions(prev => [session, ...prev]);
    setActiveSessionId(session.id);
    Haptics.selectionAsync();
    showToast('New list created');
  }, [setShoppingSessions, showToast]);

  const handleNewList = useCallback(() => {
    setNewListName('');
    setCopyFromId(null);
    setShowNewModal(true);
  }, []);

  const confirmNewList = useCallback(() => {
    const items = copyFromId
      ? (shoppingSessions.find(s => s.id === copyFromId)?.items ?? [])
      : [];
    createSession(newListName.trim(), items);
    setShowNewModal(false);
  }, [newListName, copyFromId, shoppingSessions, createSession]);

  const deleteSession = useCallback((id: number) => {
    Alert.alert('Delete List', 'Are you sure you want to delete this shopping list?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: () => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setShoppingSessions(prev => prev.filter(s => s.id !== id));
          if (activeSessionId === id) setActiveSessionId(null);
          Haptics.selectionAsync();
          showToast('List deleted');
        },
      },
    ]);
  }, [setShoppingSessions, activeSessionId, showToast]);

  const markSessionDone = useCallback((id: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    updateSession(id, s => ({ ...s, completed: !s.completed }));
    Haptics.selectionAsync();
  }, [updateSession]);

  const openSession = useCallback((id: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveSessionId(id);
  }, []);

  const backToSessions = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveSessionId(null);
  }, []);

  // --- Item helpers (scoped to active session) ---
  const addItem = useCallback((name?: string) => {
    if (!activeSession) return;
    const itemName = name || nameInput.trim();
    if (!itemName) return;
    const qty = name ? '' : qtyInput.trim();

    const exists = activeSession.items.some(i => i.name.toLowerCase() === itemName.toLowerCase());
    if (exists) { showToast('Already in the list'); return; }

    const newItem: ShoppingItem = { id: Date.now() + Math.random(), name: itemName, qty, done: false };
    updateSession(activeSession.id, s => ({ ...s, items: [...s.items, newItem] }));
    if (!name) { setNameInput(''); setQtyInput(''); }
    showToast('Added ' + itemName);
  }, [activeSession, nameInput, qtyInput, updateSession, showToast]);

  const toggleItem = useCallback((itemId: number) => {
    if (!activeSession) return;
    updateSession(activeSession.id, s => ({
      ...s,
      items: s.items.map(i => i.id === itemId ? { ...i, done: !i.done } : i),
    }));
  }, [activeSession, updateSession]);

  const deleteItem = useCallback((itemId: number) => {
    if (!activeSession) return;
    const item = activeSession.items.find(i => i.id === itemId);
    updateSession(activeSession.id, s => ({ ...s, items: s.items.filter(i => i.id !== itemId) }));
    if (item) {
      showToast(item.name + ' removed', () => {
        updateSession(activeSession.id, s => ({ ...s, items: [...s.items, item] }));
      });
    }
  }, [activeSession, updateSession, showToast]);

  const clearDone = useCallback(() => {
    if (!activeSession) return;
    const doneItems = activeSession.items.filter(i => i.done);
    if (doneItems.length === 0) { showToast('No checked items'); return; }
    updateSession(activeSession.id, s => ({ ...s, items: s.items.filter(i => !i.done) }));
    showToast(doneItems.length + ' cleared', () => {
      updateSession(activeSession.id, s => ({ ...s, items: [...s.items, ...doneItems] }));
    });
  }, [activeSession, updateSession, showToast]);

  const shareList = useCallback(async () => {
    if (!activeSession || activeSession.items.length === 0) { showToast('Nothing to share'); return; }
    const lines = sortedItems.map(i => {
      const check = i.done ? '\u2611' : '\u2610';
      const qty = i.qty ? ' (' + i.qty + ')' : '';
      return check + ' ' + i.name + qty;
    });
    const done = activeSession.items.filter(i => i.done).length;
    const text = '\uD83D\uDED2 ' + activeSession.name + '\n\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n' + lines.join('\n') + '\n\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n' + activeSession.items.length + ' items \u00B7 ' + done + ' done';
    try { await Share.share({ message: text }); } catch { /* cancelled */ }
  }, [activeSession, sortedItems, showToast]);

  const keyExtractor = useCallback((item: ShoppingItem) => String(item.id), []);

  // --- Render: Item row (v1.2.5-dev: swipe-left reveals Delete) ---
  const renderItem = useCallback(({ item }: { item: ShoppingItem }) => (
    <SwipeableRow
      itemLabel={item.name}
      actions={[
        { kind: 'delete', onPress: () => deleteItem(item.id) },
      ]}
    >
      <Card>
        <View style={styles.itemRow}>
          <TouchableOpacity
            style={[styles.checkbox, { backgroundColor: item.done ? colors.green : 'transparent', borderColor: item.done ? colors.green : colors.muted }]}
            onPress={() => toggleItem(item.id)}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel={`Toggle ${item.name}`}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: item.done }}
          >
            {item.done && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.itemContent} onPress={() => toggleItem(item.id)} activeOpacity={0.7}>
            <Text style={[styles.itemName, { color: item.done ? colors.muted : colors.deep }, item.done && styles.strikethrough]} numberOfLines={1}>
              {item.name}
            </Text>
            {item.qty ? <Text style={[styles.itemQty, { color: item.done ? colors.muted : colors.sub }, item.done && styles.strikethrough]}>{item.qty}</Text> : null}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.deleteBtn, { backgroundColor: colors.redBg }]}
            onPress={() => deleteItem(item.id)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel={`Remove ${item.name}`}
            accessibilityRole="button"
          >
            <Text style={[styles.deleteBtnText, { color: colors.red }]}>✕</Text>
          </TouchableOpacity>
        </View>
      </Card>
    </SwipeableRow>
  ), [colors, toggleItem, deleteItem]);

  // --- SESSION LIST VIEW ---
  if (!activeSession) {
    const totalItems = shoppingSessions.reduce((s, sess) => s + sess.items.length, 0);
    return (
      <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {/* Hero */}
          <Card gradient={dark ? gradients.greenHeroDark : gradients.greenHero} style={{ backgroundColor: colors.greenBg, borderColor: colors.greenBorder }}>
            <View style={styles.heroHeaderRow}>
              <DrawerMenuButton />
              <View style={styles.heroHeaderText}>
                <Text style={[styles.heroLabel, { color: colors.green }]}>🛒 SHOPPING LISTS</Text>
                <Text style={[styles.heroNum, { color: colors.green }]}>{shoppingSessions.length}</Text>
                <Text style={[styles.heroNote, { color: colors.sub }]}>
                  {shoppingSessions.length === 0 ? 'No lists yet' : shoppingSessions.length + (shoppingSessions.length === 1 ? ' list' : ' lists') + ' · ' + totalItems + ' items'}
                </Text>
              </View>
            </View>
          </Card>

          {/* New List Button */}
          <Button title="+ New Shopping List" variant="green" onPress={handleNewList} style={{ marginBottom: 16 }} />

          {/* Session cards */}
          {sortedSessions.length === 0 && (
            <EmptyState
              icon="🛒"
              text="Nothing on your list yet — tap + to start."
              hint="Create a list for this trip, or copy from a previous one."
            />
          )}
          {sortedSessions.map(s => {
            const done = s.items.filter(i => i.done).length;
            const total = s.items.length;
            const dateStr = fmtShortYear(new Date(s.createdAt));
            return (
              <Card key={s.id}>
                <TouchableOpacity onPress={() => openSession(s.id)} activeOpacity={0.7}>
                  <View style={styles.sessionRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.sessionName, { color: s.completed ? colors.muted : colors.deep }, s.completed && styles.strikethrough]} numberOfLines={1}>
                        {s.name}
                      </Text>
                      <Text style={[styles.sessionMeta, { color: colors.sub }]}>
                        {dateStr} · {total} items · {done} done
                      </Text>
                    </View>
                    {s.completed && (
                      <View style={[styles.doneBadge, { backgroundColor: colors.greenBg }]}>
                        <Text style={[styles.doneBadgeText, { color: colors.green }]}>Done</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
                <View style={styles.sessionActions}>
                  <TouchableOpacity
                    style={[styles.sessionBtn, { backgroundColor: colors.bg3 }]}
                    onPress={() => markSessionDone(s.id)}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={[styles.sessionBtnText, { color: colors.green }]}>
                      {s.completed ? '↩ Reopen' : '✓ Complete'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.sessionBtn, { backgroundColor: colors.bg3 }]}
                    onPress={() => { setCopyFromId(s.id); setNewListName(''); setShowNewModal(true); }}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={[styles.sessionBtnText, { color: colors.blue }]}>📋 Copy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.sessionBtn, { backgroundColor: colors.redBg }]}
                    onPress={() => deleteSession(s.id)}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={[styles.sessionBtnText, { color: colors.red }]}>🗑</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            );
          })}
        </ScrollView>

        {/* New List Modal */}
        <Modal visible={showNewModal} transparent animationType="fade" onRequestClose={() => setShowNewModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalBox, { backgroundColor: colors.bg2 }]}>
              <Text style={[styles.modalTitle, { color: colors.deep }]}>New Shopping List</Text>
              <Input
                placeholder="List name (optional)"
                value={newListName}
                onChangeText={setNewListName}
                returnKeyType="done"
              />
              {copyFromId ? (
                <View style={[styles.copyBanner, { backgroundColor: colors.bg3 }]}>
                  <Text style={[styles.copyBannerText, { color: colors.sub }]}>
                    📋 Copying from: {shoppingSessions.find(s => s.id === copyFromId)?.name}
                  </Text>
                  <TouchableOpacity onPress={() => setCopyFromId(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Text style={{ color: colors.red, fontFamily: 'Outfit-Bold' }}>✕</Text>
                  </TouchableOpacity>
                </View>
              ) : shoppingSessions.length > 0 ? (
                <View>
                  <Text style={[styles.copyLabel, { color: colors.sub }]}>Or copy items from a previous list:</Text>
                  {shoppingSessions.slice(0, 5).map(s => (
                    <TouchableOpacity
                      key={s.id}
                      style={[styles.copyOption, { backgroundColor: colors.bg3 }]}
                      onPress={() => setCopyFromId(s.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.copyOptionText, { color: colors.deep }]} numberOfLines={1}>{s.name}</Text>
                      <Text style={[styles.copyOptionMeta, { color: colors.muted }]}>{s.items.length} items</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}
              <View style={styles.modalBtns}>
                <Button title="Cancel" variant="outline" small onPress={() => setShowNewModal(false)} style={{ flex: 1 }} />
                <Button title="Create" variant="green" small onPress={confirmNewList} style={{ flex: 1 }} />
              </View>
            </View>
          </View>
        </Modal>

        <Toast toast={toast} dismiss={dismissToast} />
      </LinearGradient>
    );
  }

  // --- ACTIVE SESSION (item list) VIEW ---
  const totalCount = activeSession.items.length;
  const doneCount = activeSession.items.filter(i => i.done).length;
  const pendingCount = totalCount - doneCount;

  const listHeader = (
    <View>
      {/* Hero */}
      <Card gradient={dark ? gradients.greenHeroDark : gradients.greenHero} style={{ backgroundColor: colors.greenBg, borderColor: colors.greenBorder }}>
        <View style={styles.heroHeaderRow}>
          <DrawerMenuButton />
          <View style={styles.heroHeaderText}>
            <Text style={[styles.heroLabel, { color: colors.green }]}>🛒 {activeSession.name.toUpperCase()}</Text>
            <Text style={[styles.heroNum, { color: colors.green }]}>{totalCount}</Text>
            <Text style={[styles.heroNote, { color: colors.sub }]}>
              {totalCount === 0 ? 'No items yet' : totalCount + ' items on your list'}
            </Text>
          </View>
        </View>
        <View style={styles.heroStats}>
          <View style={styles.heroStatBox}>
            <Text style={[styles.heroStatVal, { color: colors.green }]}>{totalCount}</Text>
            <Text style={[styles.heroStatLbl, { color: colors.muted }]}>Total</Text>
          </View>
          <View style={styles.heroStatBox}>
            <Text style={[styles.heroStatVal, { color: colors.gold }]}>{pendingCount}</Text>
            <Text style={[styles.heroStatLbl, { color: colors.muted }]}>Pending</Text>
          </View>
          <View style={styles.heroStatBox}>
            <Text style={[styles.heroStatVal, { color: colors.blue }]}>{doneCount}</Text>
            <Text style={[styles.heroStatLbl, { color: colors.muted }]}>Done</Text>
          </View>
        </View>
      </Card>

      {/* Back + actions */}
      <View style={styles.actionRow}>
        <Button title="← All Lists" variant="outline" onPress={backToSessions} style={{ flex: 1 }} />
        <Button title="📤 Share" variant="green" onPress={shareList} style={{ flex: 1 }} />
        <Button title="🧹 Clear" variant="outline" onPress={clearDone} style={{ flex: 1 }} />
      </View>

      {/* Add item form */}
      <Card>
        <Text style={[styles.sectionLabel, { color: colors.deep }]}>➕ ADD ITEM</Text>
        <View style={styles.addRow}>
          <View style={{ flex: 2 }}>
            <Input placeholder="Item name…" value={nameInput} onChangeText={setNameInput} onSubmitEditing={() => addItem()} returnKeyType="done" />
          </View>
          <View style={{ flex: 1 }}>
            <Input placeholder="1 kg" value={qtyInput} onChangeText={setQtyInput} onSubmitEditing={() => addItem()} returnKeyType="done" />
          </View>
          <Button title="Add" variant="green" small onPress={() => addItem()} />
        </View>
      </Card>

      {/* Quick add */}
      <Card>
        <Text style={[styles.sectionLabel, { color: colors.deep }]}>⚡ QUICK ADD</Text>
        <View style={styles.quickGrid}>
          {QUICK_ADD.map(item => (
            <TouchableOpacity key={item} style={[styles.quickBtn, { backgroundColor: colors.bg3 }]} onPress={() => addItem(item)} activeOpacity={0.7}>
              <Text style={[styles.quickBtnText, { color: colors.sub }]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      <Divider label={`Items (${totalCount})`} />
      {sortedItems.length === 0 && (
        <EmptyState
          icon="🛒"
          text="This list is empty. Add items above to get going."
        />
      )}
    </View>
  );

  return (
    <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={[styles.container, { paddingTop: insets.top }]}>
      <FlatList
        data={sortedItems}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        windowSize={10}
        initialNumToRender={15}
        removeClippedSubviews
      />
      <Toast toast={toast} dismiss={dismissToast} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 4 },
  heroHeaderText: { flex: 1 },
  listContent: { padding: 20, paddingBottom: 120 },
  heroLabel: { fontSize: 12, fontFamily: 'Outfit-Bold', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 },
  heroNum: { fontFamily: 'PlayfairDisplay-ExtraBold', fontSize: 42, lineHeight: 48, letterSpacing: -0.5 },
  heroNote: { fontSize: 14, fontFamily: 'Outfit-Regular', marginTop: 6, marginBottom: 16 },
  heroStats: { flexDirection: 'row', gap: 12 },
  heroStatBox: { flex: 1, alignItems: 'center' },
  heroStatVal: { fontSize: 16, fontFamily: 'Outfit-Bold' },
  heroStatLbl: { fontSize: 11, fontFamily: 'Outfit-SemiBold', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 2 },
  actionRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  sectionLabel: { fontSize: 12, fontFamily: 'Outfit-Bold', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickBtn: { borderRadius: 16, paddingVertical: 10, paddingHorizontal: 16 },
  quickBtnText: { fontSize: 14, fontFamily: 'Outfit-SemiBold' },
  // Item row
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  checkbox: { width: 28, height: 28, borderRadius: 8, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  checkmark: { color: '#fff', fontSize: 16, fontFamily: 'Outfit-Bold', lineHeight: 18 },
  itemContent: { flex: 1, minWidth: 0 },
  itemName: { fontSize: 16, fontFamily: 'Outfit-SemiBold' },
  itemQty: { fontSize: 13, fontFamily: 'Outfit-Regular', marginTop: 2 },
  strikethrough: { textDecorationLine: 'line-through' },
  deleteBtn: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  deleteBtnText: { fontSize: 16, fontFamily: 'Outfit-Bold' },
  // Session cards
  sessionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  sessionName: { fontSize: 17, fontFamily: 'Outfit-Bold' },
  sessionMeta: { fontSize: 13, fontFamily: 'Outfit-Regular', marginTop: 2 },
  sessionActions: { flexDirection: 'row', gap: 8 },
  sessionBtn: { borderRadius: 12, paddingVertical: 8, paddingHorizontal: 14 },
  sessionBtnText: { fontSize: 13, fontFamily: 'Outfit-SemiBold' },
  doneBadge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  doneBadgeText: { fontSize: 12, fontFamily: 'Outfit-Bold' },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalBox: { borderRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontFamily: 'PlayfairDisplay-Bold', marginBottom: 16 },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 20 },
  copyLabel: { fontSize: 13, fontFamily: 'Outfit-Regular', marginTop: 16, marginBottom: 8 },
  copyOption: { borderRadius: 12, padding: 12, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  copyOptionText: { fontSize: 15, fontFamily: 'Outfit-SemiBold', flex: 1 },
  copyOptionMeta: { fontSize: 12, fontFamily: 'Outfit-Regular' },
  copyBanner: { borderRadius: 12, padding: 12, marginTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  copyBannerText: { fontSize: 13, fontFamily: 'Outfit-SemiBold', flex: 1 },
});
