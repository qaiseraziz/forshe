import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { MonthBar } from '../components/MonthBar';
import { DayStrip } from '../components/DayStrip';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { gradients } from '../constants/colors';
import { DAYS, FULL_DAYS, MEALS, MEAL_ICONS, MEAL_COLORS, MONTHS } from '../constants/data';
import { todayDay } from '../utils/dates';
import { DrawerMenuButton } from '../components/DrawerMenuButton';

export default function CookingScreen() {
  const { colors, dark } = useTheme();
  const insets = useSafeAreaInsets();
  const { cooking, setCooking } = useData();

  const [filter, setFilter] = useState('all');
  const [selMonth, setSelMonth] = useState(new Date().getMonth());
  const [selYear, setSelYear] = useState(new Date().getFullYear());
  const [day, setDay] = useState(todayDay());
  const [editKey, setEditKey] = useState<string | null>(null);
  const [editVal, setEditVal] = useState('');

  const viewDay = filter === 'today' ? todayDay() : day;

  const saveMeal = useCallback((key: string) => {
    setCooking((c) => ({ ...c, [key]: editVal.trim() }));
    setEditKey(null);
  }, [editVal, setCooking]);

  const clearMeal = useCallback((key: string) => {
    setCooking((c) => {
      const next = { ...c };
      delete next[key];
      return next;
    });
    setEditKey(null);
  }, [setCooking]);

  const handleSaveEdit = useCallback(() => {
    if (editKey) saveMeal(editKey);
  }, [editKey, saveMeal]);

  const handleClearEdit = useCallback(() => {
    if (editKey) clearMeal(editKey);
  }, [editKey, clearMeal]);

  const handleCancelEdit = useCallback(() => {
    setEditKey(null);
  }, []);

  const monthViewData = useMemo(() => {
    let plannedCount = 0;
    DAYS.forEach(d => MEALS.forEach(m => {
      if (cooking[`${d}_${m}`]) plannedCount++;
    }));
    const total = DAYS.length * MEALS.length;
    return { hasAny: plannedCount > 0, plannedCount, total };
  }, [cooking]);

  // Monthly view
  if (filter === 'month') {

    return (
      <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.container}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={[styles.content, { paddingTop: insets.top }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <MonthBar
            filter={filter}
            setFilter={setFilter}
            selMonth={selMonth}
            selYear={selYear}
            setSelMonth={setSelMonth}
            setSelYear={setSelYear}
          />
          <View style={styles.heroWrap}>
            <Card gradient={dark ? gradients.goldHeroDark : gradients.goldHero}>
              <View style={styles.heroHeaderRow}>
                <DrawerMenuButton />
                <View style={styles.heroHeaderText}>
                  <Text style={[styles.heroLabel, { color: colors.gold }]}>🍳 Meal Planner</Text>
                  <Text style={[styles.title, { color: colors.deep }]}>
                    {MONTHS[selMonth]} {selYear}
                  </Text>
                  <Text style={[styles.subtitle, { color: colors.sub }]}>
                    {monthViewData.plannedCount} of {monthViewData.total} meals planned
                  </Text>
                </View>
              </View>
            </Card>
          </View>

          {!monthViewData.hasAny ? (
            <View style={{ paddingHorizontal: 20 }}>
              <EmptyState icon="🍽️" text="No meals planned yet." hint="Switch to All view to start adding meals for each day." />
            </View>
          ) : (
            <View style={styles.monthGrid}>
              {DAYS.map((d) => (
                <Card key={d} style={styles.monthCard}>
                  <Text style={[styles.monthDayLabel, { color: colors.deep }]}>{d}</Text>
                  {MEALS.map((m) => {
                    const txt = cooking[`${d}_${m}`];
                    return (
                      <View key={m} style={styles.monthMealLine}>
                        <View style={[styles.mealDot, { backgroundColor: MEAL_COLORS[m] }]} />
                        <Text
                          style={[
                            styles.monthMealText,
                            { color: txt ? colors.sub : colors.muted },
                            !txt && styles.italic,
                          ]}
                          numberOfLines={1}
                        >
                          {txt || '—'}
                        </Text>
                      </View>
                    );
                  })}
                </Card>
              ))}
            </View>
          )}
        </ScrollView>
      </LinearGradient>
    );
  }

  // Daily view (All / Today)
  const dayCount = MEALS.filter(m => cooking[`${viewDay}_${m}`]).length;
  return (
    <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.container}>
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <MonthBar
        filter={filter}
        setFilter={setFilter}
        selMonth={selMonth}
        selYear={selYear}
        setSelMonth={setSelMonth}
        setSelYear={setSelYear}
      />
      <View style={styles.heroWrap}>
        <Card gradient={dark ? gradients.goldHeroDark : gradients.goldHero}>
          <View style={styles.heroHeaderRow}>
            <DrawerMenuButton />
            <View style={styles.heroHeaderText}>
              <Text style={[styles.heroLabel, { color: colors.gold }]}>🍳 Meal Planner</Text>
              <Text style={[styles.title, { color: colors.deep }]}>
                {filter === 'today'
                  ? (() => {
                      const n = new Date();
                      return `${FULL_DAYS[(n.getDay() + 6) % 7]}`;
                    })()
                  : FULL_DAYS[DAYS.indexOf(viewDay as typeof DAYS[number])]}
              </Text>
              <Text style={[styles.subtitle, { color: colors.sub }]}>
                {dayCount} of {MEALS.length} meals planned
              </Text>
            </View>
          </View>
        </Card>
      </View>

      {filter !== 'today' && (
        <View style={styles.dayStripWrap}>
          <DayStrip selected={viewDay} onSelect={setDay} activeColor={colors.gold} />
        </View>
      )}

      <View style={styles.mealList}>

      {MEALS.map((m) => {
        const key = `${viewDay}_${m}`;
        const meal = cooking[key] || '';
        const isEdit = editKey === key;
        const badgeColor = MEAL_COLORS[m];

        return (
          <Card key={m}>
            {/* Badge */}
            <View style={[styles.mealBadge, { backgroundColor: badgeColor + '18', borderColor: badgeColor + '40' }]}>
              <Text style={[styles.mealBadgeText, { color: badgeColor }]}>
                {MEAL_ICONS[m]} {m}
              </Text>
            </View>

            {!isEdit ? (
              <>
                <Text
                  style={[
                    meal ? styles.mealText : styles.mealEmptyText,
                    { color: meal ? colors.text : colors.muted },
                  ]}
                >
                  {meal || 'Not planned yet'}
                </Text>
                <View style={styles.mealFoot}>
                  <View />
                  <TouchableOpacity
                    onPress={() => {
                      setEditKey(key);
                      setEditVal(meal);
                    }}
                    style={[styles.editBtn, { backgroundColor: colors.bg3 }]}
                    accessibilityLabel={meal ? `Edit ${m}` : `Add ${m}`}
                  >
                    <Text style={[styles.editBtnText, { color: colors.sub }]}>{meal ? '✏️ Edit' : '+ Add meal'}</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View>
                <Input
                  value={editVal}
                  placeholder={m === 'Breakfast' ? 'e.g. Paratha & chai' : m === 'Lunch' ? 'e.g. Chicken biryani' : 'e.g. Daal chawal'}
                  onChangeText={setEditVal}
                  onSubmitEditing={handleSaveEdit}
                  autoFocus
                  style={{ marginBottom: 10 }}
                />
                <View style={styles.editBtnRow}>
                  <Button title="Save" variant="gold" small onPress={handleSaveEdit} />
                  {meal ? (
                    <Button title="Clear" variant="outline" small onPress={handleClearEdit} />
                  ) : null}
                  <Button title="Cancel" variant="outline" small onPress={handleCancelEdit} />
                </View>
              </View>
            )}
          </Card>
        );
      })}
      </View>
    </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 120,
  },
  heroWrap: { paddingHorizontal: 20, paddingTop: 12 },
  dayStripWrap: { paddingHorizontal: 20 },
  mealList: { paddingHorizontal: 20 },
  heroHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 4 },
  heroHeaderText: { flex: 1 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  section: {
    flex: 1,
  },
  heroLabel: { fontSize: 12, fontFamily: 'Outfit-Bold', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 },
  title: {
    fontFamily: 'PlayfairDisplay-ExtraBold',
    fontSize: 30,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Outfit-Regular',
    marginTop: 4,
  },
  editBtnRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  // Monthly grid
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
  },
  monthCard: {
    width: '47%',
    flexGrow: 1,
  },
  monthDayLabel: {
    fontFamily: 'Outfit-Bold',
    fontSize: 14,
    marginBottom: 8,
  },
  monthMealLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  mealDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  monthMealText: {
    fontSize: 12,
    fontFamily: 'Outfit-Regular',
    flex: 1,
  },
  italic: {
    fontStyle: 'italic',
  },
  // Meal cards
  mealBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 24,
    borderWidth: 0,
    marginBottom: 10,
  },
  mealBadgeText: {
    fontFamily: 'Outfit-Bold',
    fontSize: 13,
  },
  mealText: {
    fontFamily: 'Outfit-Regular',
    fontSize: 18,
    lineHeight: 24,
  },
  mealEmptyText: {
    fontFamily: 'Outfit-Regular',
    fontSize: 15,
    fontStyle: 'italic',
  },
  mealFoot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  editBtn: {
    borderWidth: 0,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 18,
    minHeight: 44,
    justifyContent: 'center',
  },
  editBtnText: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 13,
  },
});
