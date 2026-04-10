import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { gradients } from '../constants/colors';
import { SHOPPING_CATS } from '../constants/data';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Divider } from '../components/ui/Divider';
import { EmptyState } from '../components/ui/EmptyState';
import { Toast, useToast } from '../components/ui/Toast';
import { DrawerMenuButton } from '../components/DrawerMenuButton';
import { ShoppingItem } from '../types';

const QUICK_ADD = ['Milk', 'Bread', 'Eggs', 'Rice', 'Oil', 'Sugar', 'Atta', 'Chicken', 'Onions', 'Tomatoes'];

export default function ShoppingListScreen() {
  const { colors, dark } = useTheme();
  const insets = useSafeAreaInsets();
  const { shopping, setShopping } = useData();
  const { toast, show: showToast, dismiss: dismissToast } = useToast();

  const [nameInput, setNameInput] = useState('');
  const [qtyInput, setQtyInput] = useState('');

  // Sorted: unchecked first, then checked
  const sorted = useMemo(() => {
    const unchecked = shopping.filter(i => !i.done);
    const checked = shopping.filter(i => i.done);
    return [...unchecked, ...checked];
  }, [shopping]);

  const totalCount = shopping.length;
  const doneCount = useMemo(() => shopping.filter(i => i.done).length, [shopping]);
  const pendingCount = totalCount - doneCount;

  // Add item
  const addItem = useCallback((name?: string) => {
    const itemName = name || nameInput.trim();
    if (!itemName) return;
    const qty = name ? '' : qtyInput.trim();

    // Check for duplicate
    const exists = shopping.some(i => i.name.toLowerCase() === itemName.toLowerCase());
    if (exists) {
      showToast('Already in the list');
      return;
    }

    const newItem: ShoppingItem = {
      id: Date.now(),
      name: itemName,
      qty,
      done: false,
    };
    setShopping((prev: ShoppingItem[]) => [...prev, newItem]);
    if (!name) {
      setNameInput('');
      setQtyInput('');
    }
    showToast('Added ' + itemName);
  }, [nameInput, qtyInput, shopping, setShopping, showToast]);

  // Toggle done
  const toggleItem = useCallback((id: number) => {
    setShopping((prev: ShoppingItem[]) =>
      prev.map(i => (i.id === id ? { ...i, done: !i.done } : i)),
    );
  }, [setShopping]);

  // Delete item
  const deleteItem = useCallback((id: number) => {
    const item = shopping.find(i => i.id === id);
    setShopping((prev: ShoppingItem[]) => prev.filter(i => i.id !== id));
    if (item) {
      showToast(item.name + ' removed', () => {
        setShopping((prev: ShoppingItem[]) => [...prev, item]);
      });
    }
  }, [shopping, setShopping, showToast]);

  // Clear done
  const clearDone = useCallback(() => {
    const doneItems = shopping.filter(i => i.done);
    if (doneItems.length === 0) {
      showToast('No checked items to clear');
      return;
    }
    setShopping((prev: ShoppingItem[]) => prev.filter(i => !i.done));
    showToast(doneItems.length + ' items cleared', () => {
      setShopping((prev: ShoppingItem[]) => [...prev, ...doneItems]);
    });
  }, [shopping, setShopping, showToast]);

  // Share list
  const shareList = useCallback(async () => {
    if (shopping.length === 0) {
      showToast('Nothing to share');
      return;
    }

    const lines = sorted.map(i => {
      const check = i.done ? '\u2611' : '\u2610';
      const qty = i.qty ? ' (' + i.qty + ')' : '';
      return check + ' ' + i.name + qty;
    });

    const text =
      '\uD83D\uDED2 Shopping List\n' +
      '\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n' +
      lines.join('\n') +
      '\n\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n' +
      totalCount + ' items \u00B7 ' + doneCount + ' done';

    try {
      await Share.share({ message: text });
    } catch {
      // user cancelled
    }
  }, [shopping, sorted, totalCount, doneCount, showToast]);

  const keyExtractor = useCallback((item: ShoppingItem) => String(item.id), []);

  // Render shopping item
  const renderItem = useCallback(({ item }: { item: ShoppingItem }) => (
    <Card>
      <View style={styles.itemRow}>
        <TouchableOpacity
          style={[
            styles.checkbox,
            {
              backgroundColor: item.done ? colors.green : 'transparent',
              borderColor: item.done ? colors.green : colors.muted,
            },
          ]}
          onPress={() => toggleItem(item.id)}
          activeOpacity={0.7}
        >
          {item.done && <Text style={styles.checkmark}>✓</Text>}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.itemContent}
          onPress={() => toggleItem(item.id)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.itemName,
              { color: item.done ? colors.muted : colors.deep },
              item.done && styles.strikethrough,
            ]}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          {item.qty ? (
            <Text
              style={[
                styles.itemQty,
                { color: item.done ? colors.muted : colors.sub },
                item.done && styles.strikethrough,
              ]}
            >
              {item.qty}
            </Text>
          ) : null}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.deleteBtn, { backgroundColor: colors.redBg }]}
          onPress={() => deleteItem(item.id)}
          activeOpacity={0.7}
        >
          <Text style={[styles.deleteBtnText, { color: colors.red }]}>✕</Text>
        </TouchableOpacity>
      </View>
    </Card>
  ), [colors, toggleItem, deleteItem]);

  // List header (memoized JSX element to avoid FlatList remounting on every render)
  const listHeader = useMemo(() => (
    <View>
      {/* Hero card */}
      <Card gradient={dark ? gradients.greenHeroDark : gradients.greenHero} style={{ backgroundColor: colors.greenBg, borderColor: colors.greenBorder }}>
        <Text style={[styles.heroLabel, { color: colors.green }]}>🛒 SHOPPING LIST</Text>
        <Text style={[styles.heroNum, { color: colors.green }]}>{totalCount}</Text>
        <Text style={[styles.heroNote, { color: colors.sub }]}>
          {totalCount === 0 ? 'No items yet' : totalCount === 1 ? '1 item on your list' : totalCount + ' items on your list'}
        </Text>

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

      {/* Action buttons */}
      <View style={styles.actionRow}>
        <Button
          title="📤 Share List"
          variant="green"
          onPress={shareList}
          style={{ flex: 1 }}
        />
        <Button
          title="🧹 Clear Done"
          variant="outline"
          onPress={clearDone}
          style={{ flex: 1 }}
        />
      </View>

      {/* Add item form */}
      <Card>
        <Text style={[styles.sectionLabel, { color: colors.deep }]}>➕ ADD ITEM</Text>
        <View style={styles.addRow}>
          <View style={{ flex: 2 }}>
            <Input
              placeholder="Item name…"
              value={nameInput}
              onChangeText={setNameInput}
              onSubmitEditing={() => addItem()}
              returnKeyType="done"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Input
              placeholder="Qty"
              value={qtyInput}
              onChangeText={setQtyInput}
              onSubmitEditing={() => addItem()}
              returnKeyType="done"
            />
          </View>
          <Button title="Add" variant="green" small onPress={() => addItem()} />
        </View>
      </Card>

      {/* Quick-add presets */}
      <Card>
        <Text style={[styles.sectionLabel, { color: colors.deep }]}>⚡ QUICK ADD</Text>
        <View style={styles.quickGrid}>
          {QUICK_ADD.map(item => (
            <TouchableOpacity
              key={item}
              style={[styles.quickBtn, { backgroundColor: colors.bg3 }]}
              onPress={() => addItem(item)}
              activeOpacity={0.7}
            >
              <Text style={[styles.quickBtnText, { color: colors.sub }]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      <Divider label={`Items (${totalCount})`} />

      {sorted.length === 0 && (
        <EmptyState icon="🛒" text="Your shopping list is empty. Add some items above!" />
      )}
    </View>
  ), [colors, totalCount, doneCount, pendingCount, shareList, clearDone, nameInput, qtyInput, addItem, sorted.length]);

  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientEnd]}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      {/* Title row */}
      <View style={styles.titleRow}>
        <View style={styles.titleSection}>
          <Text style={[styles.title, { color: colors.deep }]}>Shopping List</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>Tap to check off items</Text>
        </View>
        <DrawerMenuButton />
      </View>

      <FlatList
        data={sorted}
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
  container: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    marginBottom: 20,
  },
  titleSection: {
    flex: 1,
  },
  title: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 28,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Outfit-Regular',
    marginTop: 2,
  },
  listContent: {
    padding: 20,
    paddingBottom: 120,
  },
  // Hero card
  heroLabel: {
    fontSize: 12,
    fontFamily: 'Outfit-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  heroNum: {
    fontFamily: 'PlayfairDisplay-ExtraBold',
    fontSize: 42,
    lineHeight: 48,
    letterSpacing: -0.5,
  },
  heroNote: {
    fontSize: 14,
    fontFamily: 'Outfit-Regular',
    marginTop: 6,
    marginBottom: 16,
  },
  heroStats: {
    flexDirection: 'row',
    gap: 12,
  },
  heroStatBox: {
    flex: 1,
    alignItems: 'center',
  },
  heroStatVal: {
    fontSize: 16,
    fontFamily: 'Outfit-Bold',
  },
  heroStatLbl: {
    fontSize: 11,
    fontFamily: 'Outfit-SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  // Action row
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  // Add form
  sectionLabel: {
    fontSize: 12,
    fontFamily: 'Outfit-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  // Quick add
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickBtn: {
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  quickBtnText: {
    fontSize: 14,
    fontFamily: 'Outfit-SemiBold',
  },
  // Item row
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Outfit-Bold',
    lineHeight: 18,
  },
  itemContent: {
    flex: 1,
    minWidth: 0,
  },
  itemName: {
    fontSize: 16,
    fontFamily: 'Outfit-SemiBold',
  },
  itemQty: {
    fontSize: 13,
    fontFamily: 'Outfit-Regular',
    marginTop: 2,
  },
  strikethrough: {
    textDecorationLine: 'line-through',
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: {
    fontSize: 16,
    fontFamily: 'Outfit-Bold',
  },
});
