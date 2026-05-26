import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useData } from '../context/DataContext';
import { Toast, useToast } from '../components/ui/Toast';
import { DAYS, FULL_DAYS, MEALS, MONTHS } from '../constants/data';
import { todayDay } from '../utils/dates';
import { RecipeIngredient, ShoppingSession, ShoppingItem } from '../types';
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
  HennaPill,
  ArabesqueCorner,
  MarginMark,
  MeshOverlay,
} from '../components/henna';
import type { HennaIconName } from '../components/henna';

type MealKey = (typeof MEALS)[number];

const MEAL_META: Record<MealKey, { icon: HennaIconName; accent: 'bronze' | 'henna' | 'plum' }> = {
  Breakfast: { icon: 'sun', accent: 'bronze' },
  Lunch: { icon: 'pot', accent: 'henna' },
  Dinner: { icon: 'moon', accent: 'plum' },
};

const ACCENT_FG: Record<string, string> = {
  bronze: hennaColors.bronze,
  henna: hennaColors.henna,
  plum: hennaColors.plum,
};
const ACCENT_BG: Record<string, string> = {
  bronze: hennaColors.bronzeBg,
  henna: hennaColors.hennaBg,
  plum: hennaColors.plumBg,
};

export default function CookingScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { cooking, setCooking, recipes, inventory, setShoppingSessions } = useData();
  const { toast, show: showToast, dismiss: dismissToast } = useToast();

  const [filter, setFilter] = useState<'all' | 'today' | 'month'>('all');
  const [selMonth, setSelMonth] = useState(new Date().getMonth());
  const [selYear, setSelYear] = useState(new Date().getFullYear());
  const [day, setDay] = useState<string>(todayDay());
  const [editKey, setEditKey] = useState<string | null>(null);
  const [editVal, setEditVal] = useState('');

  const viewDay = filter === 'today' ? todayDay() : day;

  const onMenu = useCallback(() => {
    Haptics.selectionAsync();
    navigation.dispatch(DrawerActions.openDrawer());
  }, [navigation]);

  const saveMeal = useCallback(
    (key: string) => {
      setCooking(c => ({ ...c, [key]: editVal.trim() }));
      setEditKey(null);
    },
    [editVal, setCooking],
  );

  const clearMeal = useCallback(
    (key: string) => {
      setCooking(c => {
        const next = { ...c };
        delete next[key];
        return next;
      });
      setEditKey(null);
    },
    [setCooking],
  );

  const handleSaveEdit = useCallback(() => {
    if (editKey) saveMeal(editKey);
  }, [editKey, saveMeal]);

  const handleClearEdit = useCallback(() => {
    if (editKey) clearMeal(editKey);
  }, [editKey, clearMeal]);

  const handleCancelEdit = useCallback(() => {
    setEditKey(null);
  }, []);

  const openRecipePicker = useCallback(
    (d: string, m: string) => {
      Haptics.selectionAsync();
      setEditKey(null);
      navigation.navigate('Recipes', { pickForMeal: { day: d, meal: m } });
    },
    [navigation],
  );

  const generateShoppingList = useCallback(() => {
    const assignedNames: string[] = [];
    DAYS.forEach(d => MEALS.forEach(m => {
      const name = cooking[`${d}_${m}`];
      if (name) assignedNames.push(name);
    }));
    if (assignedNames.length === 0) {
      Alert.alert('No meals planned', 'Assign some meals to this week before generating a shopping list.');
      return;
    }
    const matched = assignedNames
      .map(name => recipes.find(r => r.name.toLowerCase() === name.toLowerCase()))
      .filter((r): r is NonNullable<typeof r> => Boolean(r));

    if (matched.length === 0) {
      Alert.alert(
        'No matching recipes',
        "None of this week's meals match a recipe in your Recipe Book. Add the meal name to a recipe first.",
      );
      return;
    }

    const agg: Record<string, RecipeIngredient> = {};
    matched.forEach(r => {
      r.ingredients.forEach(ing => {
        const key = `${ing.name.toLowerCase()}__${ing.unit}`;
        if (agg[key]) {
          agg[key] = { ...agg[key], qty: agg[key].qty + ing.qty };
        } else {
          agg[key] = { ...ing };
        }
      });
    });

    const missing = Object.values(agg)
      .map(ing => {
        const inv = inventory.find(
          i => i.name.toLowerCase() === ing.name.toLowerCase() && i.unit === ing.unit,
        );
        const need = inv ? Math.max(0, ing.qty - inv.qty) : ing.qty;
        return { ...ing, qty: need };
      })
      .filter(ing => ing.qty > 0);

    if (missing.length === 0) {
      showToast('All ingredients in stock');
      return;
    }

    const seenNames = new Set<string>();
    const deduped: RecipeIngredient[] = [];
    missing.forEach(m => {
      const key = m.name.toLowerCase();
      if (!seenNames.has(key)) {
        seenNames.add(key);
        deduped.push(m);
      }
    });

    const today = new Date();
    const sessionName = `Week of ${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}`;
    const items: ShoppingItem[] = deduped.map(m => ({
      id: Date.now() + Math.random(),
      name: m.name,
      qty: `${m.qty} ${m.unit}`,
      done: false,
    }));
    const session: ShoppingSession = {
      id: Date.now(),
      name: sessionName,
      createdAt: new Date().toISOString(),
      items,
      completed: false,
    };
    setShoppingSessions(prev => [session, ...prev]);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showToast(`${items.length} items added to "${sessionName}"`);
  }, [cooking, recipes, inventory, setShoppingSessions, showToast]);

  const monthViewData = useMemo(() => {
    let plannedCount = 0;
    DAYS.forEach(d => MEALS.forEach(m => {
      if (cooking[`${d}_${m}`]) plannedCount++;
    }));
    const total = DAYS.length * MEALS.length;
    return { hasAny: plannedCount > 0, plannedCount, total };
  }, [cooking]);

  // Week date list (today + 6 days)
  const weekDates = useMemo(() => {
    // Map DAYS[0] = Mon ... DAYS[6] = Sun (matching FULL_DAYS index)
    const now = new Date();
    // dayIdx within DAYS (Mon=0)
    const todayIdx = (now.getDay() + 6) % 7;
    return DAYS.map((_, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() + (i - todayIdx));
      return d.getDate();
    });
  }, []);

  const headerSubtitle = useMemo(() => {
    const now = new Date();
    return `Week of ${now.getDate()} ${MONTHS[now.getMonth()].slice(0, 3)}`;
  }, []);

  // Hero — tonight's dinner or whatever's next
  const heroMeal = useMemo(() => {
    const now = new Date();
    const hr = now.getHours();
    const slot: MealKey = hr < 11 ? 'Breakfast' : hr < 16 ? 'Lunch' : 'Dinner';
    const today = todayDay();
    const dish = cooking[`${today}_${slot}`];
    return { slot, dish: dish || null };
  }, [cooking]);

  const dayCount = MEALS.filter(m => cooking[`${viewDay}_${m}`]).length;
  const viewDayFull = FULL_DAYS[DAYS.indexOf(viewDay as (typeof DAYS)[number])];

  // Monthly view
  if (filter === 'month') {
    return (
      <View style={styles.container}>
        <LinearGradient colors={hennaGradients.page} style={StyleSheet.absoluteFill} />
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top, paddingBottom: 180 }]}
          showsVerticalScrollIndicator={false}
        >
          <HennaHeader title="Cooking" subtitle="Month view" onMenu={onMenu} />
          <View style={styles.filterRow}>
            <HennaPill label="All" active={false} onPress={() => setFilter('all')} />
            <HennaPill label="Today" active={false} onPress={() => setFilter('today')} />
            <HennaPill label="Month" active onPress={() => setFilter('month')} />
            <Text style={styles.monthLabel}>
              {MONTHS[selMonth]} {selYear}
            </Text>
          </View>

          <View style={styles.heroWrap}>
            <View style={styles.heroCard}>
              <LinearGradient
                colors={hennaGradients.heroBronze}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <MeshOverlay />
              <View style={styles.heroCorner} pointerEvents="none">
                <ArabesqueCorner size={110} color={hennaColors.bronze} opacity={0.18} />
              </View>
              <View style={styles.heroInner}>
                <View style={styles.greetRow}>
                  <MarginMark color={hennaColors.bronze} />
                  <Text style={[hennaTextStyles.eyebrow, { color: hennaColors.bronze }]}>
                    Meal planner
                  </Text>
                </View>
                <Text style={styles.heroDish}>
                  {MONTHS[selMonth]} {selYear}
                </Text>
                <Text style={styles.heroDishSub}>
                  {monthViewData.plannedCount} of {monthViewData.total} meals planned
                </Text>
              </View>
            </View>
          </View>

          {!monthViewData.hasAny ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>No meals planned yet.</Text>
              <Text style={styles.emptyHint}>Switch back to All to plan each day.</Text>
            </View>
          ) : (
            <View style={styles.monthGrid}>
              {DAYS.map(d => (
                <HennaCard key={d} style={styles.monthCard} padding={14}>
                  <Text style={styles.monthDayLabel}>{d}</Text>
                  {MEALS.map(m => {
                    const txt = cooking[`${d}_${m}`];
                    const meta = MEAL_META[m as MealKey];
                    return (
                      <View key={m} style={styles.monthMealLine}>
                        <View
                          style={[
                            styles.monthMealDot,
                            { backgroundColor: ACCENT_FG[meta.accent] },
                          ]}
                        />
                        <Text
                          style={[
                            styles.monthMealText,
                            !txt && styles.italic,
                          ]}
                          numberOfLines={1}
                        >
                          {txt || '—'}
                        </Text>
                      </View>
                    );
                  })}
                </HennaCard>
              ))}
            </View>
          )}
        </ScrollView>
        <Toast toast={toast} dismiss={dismissToast} />
      </View>
    );
  }

  // Daily view
  return (
    <View style={styles.container}>
      <LinearGradient colors={hennaGradients.page} style={StyleSheet.absoluteFill} />
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top, paddingBottom: 180 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <HennaHeader
          title="Cooking"
          subtitle={headerSubtitle}
          onMenu={onMenu}
          action={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Shopping list"
              onPress={generateShoppingList}
              hitSlop={8}
              style={styles.headerIconBtn}
            >
              <HennaIcon name="cart" size={18} color={hennaColors.ink2} />
            </Pressable>
          }
        />

        <View style={styles.filterRow}>
          <HennaPill label="All" active={filter === 'all'} onPress={() => setFilter('all')} />
          <HennaPill label="Today" active={filter === 'today'} onPress={() => setFilter('today')} />
          <HennaPill label="Month" active={false} onPress={() => setFilter('month')} />
        </View>

        {/* Hero card */}
        <View style={styles.heroWrap}>
          <View style={styles.heroCard}>
            <LinearGradient
              colors={hennaGradients.heroBronze}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <MeshOverlay />
            <View style={styles.heroCorner} pointerEvents="none">
              <ArabesqueCorner size={110} color={hennaColors.bronze} opacity={0.18} />
            </View>
            <View style={styles.heroInner}>
              <View style={styles.greetRow}>
                <MarginMark color={hennaColors.bronze} />
                <Text style={[hennaTextStyles.eyebrow, { color: hennaColors.bronze }]}>
                  Today's {heroMeal.slot.toLowerCase()}
                </Text>
              </View>
              <Text style={styles.heroDish}>{heroMeal.dish || 'Tap to plan'}</Text>
              <Text style={styles.heroDishSub}>
                {dayCount} of {MEALS.length} meals planned · {viewDayFull}
              </Text>
            </View>
          </View>
        </View>

        {/* Day strip */}
        {filter !== 'today' && (
          <View style={styles.dayStrip}>
            {DAYS.map((d, i) => {
              const active = d === viewDay;
              return (
                <Pressable
                  key={d}
                  accessibilityRole="button"
                  accessibilityLabel={`Day ${d}`}
                  accessibilityState={{ selected: active }}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setDay(d);
                  }}
                  style={({ pressed }) => [
                    styles.dayCell,
                    active && { backgroundColor: hennaColors.henna },
                    { opacity: pressed ? 0.9 : 1 },
                  ]}
                >
                  <Text
                    style={[
                      styles.dayCellLbl,
                      { color: active ? hennaColors.paper : hennaColors.ink2 },
                    ]}
                  >
                    {d}
                  </Text>
                  <Text
                    style={[
                      styles.dayCellNum,
                      { color: active ? hennaColors.paper : hennaColors.ink },
                    ]}
                  >
                    {weekDates[i]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Meals for selected day */}
        <View style={styles.mealList}>
          {MEALS.map(m => {
            const key = `${viewDay}_${m}`;
            const meal = cooking[key] || '';
            const isEdit = editKey === key;
            const meta = MEAL_META[m as MealKey];

            return (
              <HennaCard key={m} padding={0} style={styles.mealCard}>
                <View style={styles.mealRowTop}>
                  <View style={[styles.mealIcon, { backgroundColor: ACCENT_BG[meta.accent] }]}>
                    <HennaIcon name={meta.icon} size={20} color={ACCENT_FG[meta.accent]} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[hennaTextStyles.eyebrow]}>{m}</Text>
                    {!isEdit ? (
                      meal ? (
                        <Text style={styles.mealText}>{meal}</Text>
                      ) : (
                        <Text style={styles.mealEmpty}>Tap to plan</Text>
                      )
                    ) : null}
                  </View>
                  {!isEdit && (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={meal ? `Edit ${m}` : `Add ${m}`}
                      onPress={() => {
                        setEditKey(key);
                        setEditVal(meal);
                      }}
                      hitSlop={8}
                      style={styles.editIconBtn}
                    >
                      <HennaIcon
                        name={meal ? 'pencil' : 'plus'}
                        size={16}
                        color={meal ? hennaColors.muted : ACCENT_FG[meta.accent]}
                      />
                    </Pressable>
                  )}
                </View>

                {isEdit && (
                  <View style={styles.editWrap}>
                    <TextInput
                      value={editVal}
                      placeholder={
                        m === 'Breakfast'
                          ? 'e.g. Paratha & chai'
                          : m === 'Lunch'
                            ? 'e.g. Chicken biryani'
                            : 'e.g. Daal chawal'
                      }
                      placeholderTextColor={hennaColors.muted}
                      onChangeText={setEditVal}
                      onSubmitEditing={handleSaveEdit}
                      autoFocus
                      style={styles.editInput}
                    />
                    <View style={styles.editBtnRow}>
                      <HennaButton title="Save" variant="bronze" size="sm" onPress={handleSaveEdit} />
                      <HennaButton
                        title="From Recipes"
                        icon="book"
                        variant="outline"
                        size="sm"
                        onPress={() => openRecipePicker(viewDay, m)}
                      />
                      {meal ? (
                        <HennaButton title="Clear" variant="outline" size="sm" onPress={handleClearEdit} />
                      ) : null}
                      <HennaButton title="Cancel" variant="ghost" size="sm" onPress={handleCancelEdit} />
                    </View>
                  </View>
                )}
              </HennaCard>
            );
          })}
        </View>

        {/* Shopping nudge */}
        <View style={styles.cartNudgeWrap}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Generate shopping list from this week"
            onPress={generateShoppingList}
            style={({ pressed }) => [styles.cartNudge, { opacity: pressed ? 0.92 : 1 }]}
          >
            <HennaIcon name="cart" size={18} color={hennaColors.henna} />
            <View style={{ flex: 1 }}>
              <Text style={styles.cartNudgeTitle}>Generate shopping list</Text>
              <Text style={styles.cartNudgeSub}>From this week's meals · subtract inventory</Text>
            </View>
            <HennaIcon name="chev-right" size={14} color={hennaColors.muted} />
          </Pressable>
        </View>
      </ScrollView>
      <Toast toast={toast} dismiss={dismissToast} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 180 },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterRow: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  monthLabel: {
    marginLeft: 'auto',
    fontFamily: hennaFonts.ui,
    fontSize: 11,
    color: hennaColors.muted,
  },

  // Hero
  heroWrap: { paddingHorizontal: 16 },
  heroCard: {
    borderRadius: hennaRadii.card,
    overflow: 'hidden',
    position: 'relative',
    ...hennaShadows.md,
  },
  heroCorner: { position: 'absolute', top: -6, right: -6 },
  heroInner: { paddingVertical: 20, paddingHorizontal: 22, position: 'relative' },
  greetRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroDish: {
    marginTop: 6,
    fontFamily: hennaFonts.serif,
    fontSize: 26,
    color: hennaColors.ink,
    letterSpacing: -0.3,
  },
  heroDishSub: {
    marginTop: 6,
    fontFamily: hennaFonts.ui,
    fontSize: 12,
    color: hennaColors.ink2,
  },

  // Day strip
  dayStrip: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 12,
    gap: 6,
  },
  dayCell: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 16,
    alignItems: 'center',
    gap: 2,
    backgroundColor: hennaColors.paper,
    borderWidth: 1,
    borderColor: hennaColors.line,
    minHeight: 56,
  },
  dayCellLbl: {
    fontFamily: hennaFonts.uiSemi,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  dayCellNum: {
    fontFamily: hennaFonts.serif,
    fontSize: 16,
  },

  // Meal cards
  mealList: { paddingHorizontal: 16, gap: 12 },
  mealCard: { marginBottom: 0 },
  mealRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  mealIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealText: {
    marginTop: 3,
    fontFamily: hennaFonts.serif,
    fontSize: 16,
    color: hennaColors.ink,
  },
  mealEmpty: {
    marginTop: 3,
    fontFamily: hennaFonts.ui,
    fontStyle: 'italic',
    fontSize: 13,
    color: hennaColors.soft,
  },
  editIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editWrap: {
    paddingHorizontal: 18,
    paddingBottom: 16,
    paddingTop: 4,
  },
  editInput: {
    backgroundColor: hennaColors.paper2,
    borderRadius: hennaRadii.input,
    borderWidth: 1,
    borderColor: hennaColors.line,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: hennaFonts.ui,
    fontSize: 14,
    color: hennaColors.ink,
    minHeight: 44,
    marginBottom: 10,
  },
  editBtnRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  // Cart nudge
  cartNudgeWrap: { paddingHorizontal: 16, paddingTop: 14 },
  cartNudge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: hennaColors.paper,
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: hennaColors.lineStrong,
    borderStyle: 'dashed',
  },
  cartNudgeTitle: {
    fontFamily: hennaFonts.uiSemi,
    fontSize: 13,
    color: hennaColors.ink,
  },
  cartNudgeSub: {
    fontFamily: hennaFonts.ui,
    fontSize: 11,
    color: hennaColors.muted,
    marginTop: 2,
  },

  // Month
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  monthCard: { width: '47%', flexGrow: 1 },
  monthDayLabel: {
    fontFamily: hennaFonts.serif,
    fontSize: 14,
    color: hennaColors.ink,
    marginBottom: 8,
  },
  monthMealLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  monthMealDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  monthMealText: {
    flex: 1,
    fontFamily: hennaFonts.ui,
    fontSize: 12,
    color: hennaColors.ink2,
  },
  italic: {
    fontStyle: 'italic',
    color: hennaColors.muted,
  },

  // Empty
  emptyWrap: { paddingHorizontal: 24, paddingVertical: 32, alignItems: 'center' },
  emptyTitle: {
    fontFamily: hennaFonts.serif,
    fontSize: 18,
    color: hennaColors.ink,
    textAlign: 'center',
  },
  emptyHint: {
    marginTop: 8,
    fontFamily: hennaFonts.ui,
    fontSize: 12,
    color: hennaColors.muted,
    textAlign: 'center',
  },
});
