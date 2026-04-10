import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { MonthBar } from '../components/MonthBar';
import { DayStrip } from '../components/DayStrip';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { DAYS, FULL_DAYS, MEALS, MEAL_ICONS, MEAL_COLORS, MONTHS } from '../constants/data';
import { todayDay } from '../utils/dates';
import { DrawerMenuButton } from '../components/DrawerMenuButton';

export default function CookingScreen() {
  const { colors } = useTheme();
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

  const monthViewData = useMemo(() => {
    let hasAny = false;
    DAYS.forEach(d => MEALS.forEach(m => {
      if (cooking[`${d}_${m}`]) hasAny = true;
    }));
    return { hasAny };
  }, [cooking]);

  // Monthly view
  if (filter === 'month') {

    return (
      <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.container}>
        <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top }]}>
          <MonthBar
            filter={filter}
            setFilter={setFilter}
            selMonth={selMonth}
            selYear={selYear}
            setSelMonth={setSelMonth}
            setSelYear={setSelYear}
          />
          <View style={styles.titleRow}>
            <View style={styles.section}>
              <Text style={[styles.title, { color: colors.deep }]}>Meal Planner</Text>
              <Text style={[styles.subtitle, { color: colors.muted }]}>
                {MONTHS[selMonth]} {selYear} overview
              </Text>
            </View>
            <DrawerMenuButton />
          </View>

          {!monthViewData.hasAny ? (
            <EmptyState icon="🍽️" text="No meals planned yet." />
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
  return (
    <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.container}>
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top }]}>
      <MonthBar
        filter={filter}
        setFilter={setFilter}
        selMonth={selMonth}
        selYear={selYear}
        setSelMonth={setSelMonth}
        setSelYear={setSelYear}
      />
      <View style={styles.titleRow}>
        <View style={styles.section}>
          <Text style={[styles.title, { color: colors.deep }]}>Meal Planner</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            {filter === 'today'
              ? (() => {
                  const n = new Date();
                  return `${FULL_DAYS[(n.getDay() + 6) % 7]}, ${n.getDate()} ${MONTHS[n.getMonth()]}`;
                })()
              : 'Tap a day to plan meals'}
          </Text>
        </View>
        <DrawerMenuButton />
      </View>

      {filter !== 'today' && (
        <DayStrip selected={viewDay} onSelect={setDay} activeColor={colors.gold} />
      )}

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
                    style={[styles.editBtn, { borderColor: colors.border }]}
                  >
                    <Text style={[styles.editBtnText, { color: colors.sub }]}>✏️ Edit</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={styles.editRow}>
                <TextInput
                  style={[
                    styles.editInput,
                    { backgroundColor: colors.bg3, borderColor: colors.border, color: colors.text },
                  ]}
                  value={editVal}
                  placeholder={`What's for ${m}?`}
                  placeholderTextColor={colors.muted}
                  onChangeText={setEditVal}
                  onSubmitEditing={() => saveMeal(key)}
                  autoFocus
                />
                <TouchableOpacity
                  style={[styles.saveBtn, { backgroundColor: colors.gold }]}
                  onPress={() => saveMeal(key)}
                >
                  <Text style={styles.saveBtnText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.clearBtn, { borderColor: colors.border }]}
                  onPress={() => clearMeal(key)}
                >
                  <Text style={[styles.clearBtnText, { color: colors.sub }]}>✕</Text>
                </TouchableOpacity>
              </View>
            )}
          </Card>
        );
      })}
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
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, marginBottom: 18 },
  section: {
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
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  editBtnText: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 13,
  },
  editRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  editInput: {
    flex: 1,
    borderWidth: 0,
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Outfit-Regular',
    minHeight: 54,
  },
  saveBtn: {
    borderRadius: 16,
    paddingVertical: 15,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontFamily: 'Outfit-Bold',
    fontSize: 14,
  },
  clearBtn: {
    borderWidth: 0,
    borderRadius: 16,
    paddingVertical: 11,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearBtnText: {
    fontFamily: 'Outfit-Bold',
    fontSize: 16,
  },
});
