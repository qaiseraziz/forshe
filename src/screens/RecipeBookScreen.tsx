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
import { useRoute, useNavigation, DrawerActions } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useData } from '../context/DataContext';
import { Toast, useToast } from '../components/ui/Toast';
import { LottieBox } from '../components/ui/LottieBox';
import { Recipe, RecipeIngredient, ShoppingSession, ShoppingItem } from '../types';
import { todayDay } from '../utils/dates';
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
  ArabesqueCorner,
  MarginMark,
  MeshOverlay,
  DividerOrnament,
} from '../components/henna';

type Mode = 'list' | 'detail' | 'edit';

interface RouteParams {
  pickForMeal?: { day: string; meal: string };
}

export default function RecipeBookScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const {
    recipes,
    setRecipes,
    inventory,
    setInventory,
    setCooking,
    shoppingSessions,
    setShoppingSessions,
    allLoaded,
  } = useData();
  const { toast, show: showToast, dismiss: dismissToast } = useToast();

  const pickForMeal: RouteParams['pickForMeal'] = route.params?.pickForMeal;

  const [mode, setMode] = useState<Mode>('list');
  const [activeId, setActiveId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [cookSparkleVisible, setCookSparkleVisible] = useState(false);

  const [fName, setFName] = useState('');
  const [fServings, setFServings] = useState('4');
  const [fPrep, setFPrep] = useState('0');
  const [fCook, setFCook] = useState('0');
  const [fNotes, setFNotes] = useState('');
  const [fIngredients, setFIngredients] = useState<RecipeIngredient[]>([]);
  const [fSteps, setFSteps] = useState<string[]>(['']);
  const [ingName, setIngName] = useState('');
  const [ingQty, setIngQty] = useState('');
  const [ingUnit, setIngUnit] = useState('g');

  const rNameRef = useRef<TextInput | null>(null);
  const rServingsRef = useRef<TextInput | null>(null);
  const rPrepRef = useRef<TextInput | null>(null);
  const rCookRef = useRef<TextInput | null>(null);
  const rNotesRef = useRef<TextInput | null>(null);
  const ingNameRef = useRef<TextInput | null>(null);
  const ingQtyRef = useRef<TextInput | null>(null);
  const ingUnitRef = useRef<TextInput | null>(null);

  const [shoppingModal, setShoppingModal] = useState<{ visible: boolean; missing: RecipeIngredient[] }>({
    visible: false,
    missing: [],
  });

  const onMenu = useCallback(() => {
    Haptics.selectionAsync();
    navigation.dispatch(DrawerActions.openDrawer());
  }, [navigation]);

  const activeRecipe = useMemo(
    () => recipes.find(r => r.id === activeId) ?? null,
    [recipes, activeId],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...recipes]
      .filter(r => !q || r.name.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [recipes, search]);

  const openDetail = useCallback((id: number) => {
    setActiveId(id);
    setMode('detail');
  }, []);

  const backToList = useCallback(() => {
    setActiveId(null);
    setMode('list');
  }, []);

  const resetEditForm = useCallback(() => {
    setFName('');
    setFServings('4');
    setFPrep('0');
    setFCook('0');
    setFNotes('');
    setFIngredients([]);
    setFSteps(['']);
    setIngName('');
    setIngQty('');
    setIngUnit('g');
  }, []);

  const startNewRecipe = useCallback(() => {
    setActiveId(null);
    resetEditForm();
    setMode('edit');
  }, [resetEditForm]);

  const startEditRecipe = useCallback((r: Recipe) => {
    setActiveId(r.id);
    setFName(r.name);
    setFServings(String(r.servings));
    setFPrep(String(r.prepMinutes));
    setFCook(String(r.cookMinutes));
    setFNotes(r.notes || '');
    setFIngredients(r.ingredients);
    setFSteps(r.steps.length ? r.steps : ['']);
    setMode('edit');
  }, []);

  const deleteRecipe = useCallback(
    (r: Recipe) => {
      Alert.alert('Delete Recipe', `Delete "${r.name}"?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setRecipes(prev => prev.filter(x => x.id !== r.id));
            backToList();
            showToast(r.name + ' deleted', () => {
              setRecipes(prev => [r, ...prev]);
            });
          },
        },
      ]);
    },
    [setRecipes, showToast, backToList],
  );

  const addIngredientToForm = useCallback(() => {
    if (!ingName.trim()) return;
    const qty = parseFloat(ingQty);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Invalid quantity', 'Ingredient quantity must be a positive number.');
      return;
    }
    setFIngredients(prev => [...prev, { name: ingName.trim(), qty, unit: ingUnit.trim() || 'pcs' }]);
    setIngName('');
    setIngQty('');
  }, [ingName, ingQty, ingUnit]);

  const removeIngredient = useCallback((idx: number) => {
    setFIngredients(prev => prev.filter((_, i) => i !== idx));
  }, []);

  const updateStep = useCallback((idx: number, text: string) => {
    setFSteps(prev => prev.map((s, i) => (i === idx ? text : s)));
  }, []);

  const addStep = useCallback(() => {
    setFSteps(prev => [...prev, '']);
  }, []);

  const removeStep = useCallback((idx: number) => {
    setFSteps(prev => prev.filter((_, i) => i !== idx));
  }, []);

  const saveRecipeEdit = useCallback(() => {
    if (!fName.trim()) {
      Alert.alert('Missing name', 'Please enter a recipe name.');
      return;
    }
    if (fIngredients.length === 0) {
      Alert.alert('No ingredients', 'Add at least one ingredient before saving.');
      return;
    }
    const servings = Math.max(1, parseInt(fServings, 10) || 1);
    const prep = Math.max(0, parseInt(fPrep, 10) || 0);
    const cook = Math.max(0, parseInt(fCook, 10) || 0);
    const cleanSteps = fSteps.map(s => s.trim()).filter(Boolean);

    if (activeId !== null) {
      setRecipes(prev => prev.map(r =>
        r.id === activeId
          ? {
              ...r,
              name: fName.trim(),
              servings,
              prepMinutes: prep,
              cookMinutes: cook,
              notes: fNotes.trim() || undefined,
              ingredients: fIngredients,
              steps: cleanSteps,
            }
          : r,
      ));
      showToast('Recipe updated');
      setMode('detail');
    } else {
      const recipe: Recipe = {
        id: Date.now(),
        name: fName.trim(),
        servings,
        prepMinutes: prep,
        cookMinutes: cook,
        ingredients: fIngredients,
        steps: cleanSteps,
        notes: fNotes.trim() || undefined,
        createdAt: new Date().toISOString(),
      };
      setRecipes(prev => [recipe, ...prev]);
      setActiveId(recipe.id);
      showToast('Recipe saved');
      setMode('detail');
    }
    Haptics.selectionAsync();
  }, [fName, fIngredients, fServings, fPrep, fCook, fSteps, fNotes, activeId, setRecipes, showToast]);

  const pickRecipeForMeal = useCallback(
    (r: Recipe) => {
      if (!pickForMeal) return;
      const key = `${pickForMeal.day}_${pickForMeal.meal}`;
      setCooking(c => ({ ...c, [key]: r.name }));
      Haptics.selectionAsync();
      showToast(`${r.name} set for ${pickForMeal.meal}`);
      setTimeout(() => navigation.goBack(), 400);
    },
    [pickForMeal, setCooking, navigation, showToast],
  );

  const cookRecipe = useCallback(
    (r: Recipe) => {
      const day = todayDay();
      const now = new Date();
      const hr = now.getHours();
      const meal = hr < 11 ? 'Breakfast' : hr < 16 ? 'Lunch' : 'Dinner';
      const key = `${day}_${meal}`;
      setCooking(c => ({ ...c, [key]: r.name }));

      setInventory(prev =>
        prev.map(inv => {
          const ing = r.ingredients.find(
            x => x.name.toLowerCase() === inv.name.toLowerCase() && x.unit === inv.unit,
          );
          if (!ing) return inv;
          const nextQty = Math.max(0, inv.qty - ing.qty);
          return { ...inv, qty: nextQty, lastUpdated: new Date().toISOString() };
        }),
      );

      showToast(`Cooking ${r.name} — logged for ${meal}`);
      Haptics.selectionAsync();
      setCookSparkleVisible(true);
    },
    [setCooking, setInventory, showToast],
  );

  const computeMissing = useCallback(
    (r: Recipe): RecipeIngredient[] => {
      return r.ingredients
        .filter(ing => {
          const inv = inventory.find(
            i => i.name.toLowerCase() === ing.name.toLowerCase() && i.unit === ing.unit,
          );
          if (!inv) return true;
          return inv.qty < ing.qty;
        })
        .map(ing => {
          const inv = inventory.find(
            i => i.name.toLowerCase() === ing.name.toLowerCase() && i.unit === ing.unit,
          );
          const needed = inv ? ing.qty - inv.qty : ing.qty;
          return { ...ing, qty: needed };
        });
    },
    [inventory],
  );

  const openShoppingModal = useCallback(
    (r: Recipe) => {
      const missing = computeMissing(r);
      if (missing.length === 0) {
        showToast('All ingredients in stock');
        return;
      }
      setShoppingModal({ visible: true, missing });
    },
    [computeMissing, showToast],
  );

  const appendToSession = useCallback(
    (sessionId: number, missing: RecipeIngredient[]) => {
      setShoppingSessions(prev =>
        prev.map(s => {
          if (s.id !== sessionId) return s;
          const newItems: ShoppingItem[] = missing
            .filter(m => !s.items.some(i => i.name.toLowerCase() === m.name.toLowerCase()))
            .map(m => ({
              id: Date.now() + Math.random(),
              name: m.name,
              qty: `${m.qty} ${m.unit}`,
              done: false,
            }));
          return { ...s, items: [...s.items, ...newItems] };
        }),
      );
      setShoppingModal({ visible: false, missing: [] });
      showToast(missing.length + ' items added');
    },
    [setShoppingSessions, showToast],
  );

  const createNewSessionFromMissing = useCallback(
    (missing: RecipeIngredient[], name: string) => {
      const session: ShoppingSession = {
        id: Date.now(),
        name,
        createdAt: new Date().toISOString(),
        items: missing.map(m => ({
          id: Date.now() + Math.random(),
          name: m.name,
          qty: `${m.qty} ${m.unit}`,
          done: false,
        })),
        completed: false,
      };
      setShoppingSessions(prev => [session, ...prev]);
      setShoppingModal({ visible: false, missing: [] });
      showToast('New shopping list created');
    },
    [setShoppingSessions, showToast],
  );

  const pickTitle = useMemo(() => {
    if (!pickForMeal) return null;
    return `Pick a recipe for ${pickForMeal.day} · ${pickForMeal.meal}`;
  }, [pickForMeal]);

  // ── DETAIL VIEW ──
  if (mode === 'detail' && activeRecipe) {
    const totalTime = activeRecipe.prepMinutes + activeRecipe.cookMinutes;
    const missing = computeMissing(activeRecipe);
    return (
      <View style={styles.container}>
        <LinearGradient colors={hennaGradients.page} style={StyleSheet.absoluteFill} />
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top, paddingBottom: 180 }]}
          showsVerticalScrollIndicator={false}
        >
          <HennaHeader
            title="Recipe"
            subtitle={activeRecipe.name}
            onMenu={onMenu}
            action={
              <Pressable onPress={backToList} hitSlop={8} style={styles.headerIconBtn} accessibilityLabel="Back">
                <HennaIcon name="close" size={18} color={hennaColors.ink2} />
              </Pressable>
            }
          />

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
                    Recipe
                  </Text>
                </View>
                <Text style={styles.heroName}>{activeRecipe.name}</Text>
                <Text style={styles.heroSub}>
                  Serves {activeRecipe.servings} · {totalTime > 0 ? `${totalTime} min` : 'untimed'}
                </Text>

                <View style={styles.detailStatsRow}>
                  <View style={styles.statBox}>
                    <Text style={[styles.statVal, { color: hennaColors.bronze }]}>{activeRecipe.prepMinutes}</Text>
                    <Text style={styles.statLbl}>Prep min</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={[styles.statVal, { color: hennaColors.sage }]}>{activeRecipe.cookMinutes}</Text>
                    <Text style={styles.statLbl}>Cook min</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={[styles.statVal, { color: hennaColors.plum }]}>{activeRecipe.servings}</Text>
                    <Text style={styles.statLbl}>Servings</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.detailActions}>
            {pickForMeal ? (
              <HennaButton
                title="Pick"
                icon="check"
                variant="primary"
                onPress={() => pickRecipeForMeal(activeRecipe)}
                style={{ flex: 1 }}
              />
            ) : (
              <HennaButton
                title="Cook this"
                icon="utensils"
                variant="primary"
                onPress={() => cookRecipe(activeRecipe)}
                style={{ flex: 1 }}
              />
            )}
            <HennaButton
              title="Edit"
              icon="pencil"
              variant="outline"
              onPress={() => startEditRecipe(activeRecipe)}
            />
          </View>

          {!pickForMeal && (
            <View style={styles.body}>
              <HennaButton
                title={
                  missing.length > 0
                    ? `+ ${missing.length} missing to shopping`
                    : 'All in stock'
                }
                icon="cart"
                variant={missing.length > 0 ? 'sage' : 'outline'}
                onPress={() => openShoppingModal(activeRecipe)}
                full
                style={{ marginBottom: 14 }}
              />
            </View>
          )}

          {/* Ingredients */}
          <DividerOrnament color={hennaColors.henna} />
          <Text style={[hennaTextStyles.eyebrow, styles.sectionEyebrow]}>
            Ingredients · {activeRecipe.ingredients.length}
          </Text>
          <View style={styles.body}>
            <HennaCard padding={0} style={{ marginBottom: 14 }}>
              {activeRecipe.ingredients.map((ing, i) => {
                const inv = inventory.find(
                  x => x.name.toLowerCase() === ing.name.toLowerCase() && x.unit === ing.unit,
                );
                const inStock = inv && inv.qty >= ing.qty;
                const missingQty = inv ? Math.max(0, ing.qty - inv.qty) : ing.qty;
                return (
                  <View
                    key={i}
                    style={[
                      styles.ingRow,
                      i < activeRecipe.ingredients.length - 1 && {
                        borderBottomWidth: 1,
                        borderBottomColor: hennaColors.line,
                      },
                    ]}
                  >
                    <Text style={styles.ingName}>{ing.name}</Text>
                    <View style={styles.ingRight}>
                      <Text style={styles.ingQty}>{ing.qty} {ing.unit}</Text>
                      {inStock ? (
                        <HennaBadge accent="sage">in stock</HennaBadge>
                      ) : (
                        <HennaBadge accent="henna">
                          {inv ? `need ${missingQty} ${ing.unit}` : 'missing'}
                        </HennaBadge>
                      )}
                    </View>
                  </View>
                );
              })}
            </HennaCard>
          </View>

          {/* Steps */}
          {activeRecipe.steps.length > 0 && (
            <>
              <DividerOrnament color={hennaColors.bronze} />
              <Text style={[hennaTextStyles.eyebrow, styles.sectionEyebrow]}>Steps</Text>
              <View style={styles.body}>
                <HennaCard padding={18} style={{ marginBottom: 14 }}>
                  {activeRecipe.steps.map((step, i) => (
                    <View key={i} style={styles.stepRow}>
                      <View style={styles.stepNum}>
                        <Text style={styles.stepNumText}>{i + 1}</Text>
                      </View>
                      <Text style={styles.stepText}>{step}</Text>
                    </View>
                  ))}
                </HennaCard>
              </View>
            </>
          )}

          {activeRecipe.notes ? (
            <>
              <DividerOrnament color={hennaColors.plum} />
              <Text style={[hennaTextStyles.eyebrow, styles.sectionEyebrow]}>Notes</Text>
              <View style={styles.body}>
                <HennaCard padding={18} style={{ marginBottom: 14 }}>
                  <Text style={styles.notesText}>{activeRecipe.notes}</Text>
                </HennaCard>
              </View>
            </>
          ) : null}

          <View style={styles.detailActions}>
            <HennaButton
              title="Delete"
              icon="trash"
              variant="outline"
              onPress={() => deleteRecipe(activeRecipe)}
            />
          </View>
        </ScrollView>

        {/* Shopping target modal */}
        <Modal
          visible={shoppingModal.visible}
          transparent
          animationType="fade"
          onRequestClose={() => setShoppingModal({ visible: false, missing: [] })}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>
                Add {shoppingModal.missing.length} missing items
              </Text>
              <Text style={styles.modalSub}>Where should these go?</Text>

              {shoppingSessions.filter(s => !s.completed).length > 0 && (
                <>
                  <Text style={[hennaTextStyles.eyebrow, { marginTop: 12, marginBottom: 8 }]}>
                    Active lists
                  </Text>
                  {shoppingSessions
                    .filter(s => !s.completed)
                    .slice(0, 4)
                    .map(s => (
                      <Pressable
                        key={s.id}
                        style={({ pressed }) => [
                          styles.targetOption,
                          { opacity: pressed ? 0.92 : 1 },
                        ]}
                        onPress={() => appendToSession(s.id, shoppingModal.missing)}
                      >
                        <Text style={styles.targetName} numberOfLines={1}>
                          {s.name}
                        </Text>
                        <Text style={styles.targetMeta}>{s.items.length} items</Text>
                      </Pressable>
                    ))}
                </>
              )}

              <HennaButton
                title={`+ New list from "${activeRecipe.name}"`}
                variant="sage"
                onPress={() => createNewSessionFromMissing(shoppingModal.missing, activeRecipe.name)}
                style={{ marginTop: 12 }}
                full
              />
              <HennaButton
                title="Cancel"
                variant="outline"
                size="sm"
                onPress={() => setShoppingModal({ visible: false, missing: [] })}
                style={{ marginTop: 10, alignSelf: 'flex-start' }}
              />
            </View>
          </View>
        </Modal>

        <Toast toast={toast} dismiss={dismissToast} />

        {cookSparkleVisible && (
          <View style={styles.sparkleOverlay} pointerEvents="none">
            <LottieBox
              animation="sparkle"
              size={180}
              fallbackEmoji="✨"
              onAnimationFinish={() => setCookSparkleVisible(false)}
            />
          </View>
        )}
      </View>
    );
  }

  // ── EDIT VIEW ──
  if (mode === 'edit') {
    return (
      <View style={styles.container}>
        <LinearGradient colors={hennaGradients.page} style={StyleSheet.absoluteFill} />
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top, paddingBottom: 180 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <HennaHeader
            title={activeId !== null ? 'Edit recipe' : 'New recipe'}
            onMenu={onMenu}
            action={
              <Pressable
                onPress={() => (activeId !== null ? setMode('detail') : backToList())}
                hitSlop={8}
                style={styles.headerIconBtn}
                accessibilityLabel="Cancel edit"
              >
                <HennaIcon name="close" size={18} color={hennaColors.ink2} />
              </Pressable>
            }
          />

          <View style={styles.body}>
            <HennaCard padding={18} style={{ marginBottom: 14 }}>
              <HennaInput
                ref={rNameRef}
                label="Name"
                placeholder="e.g. Chicken Biryani"
                value={fName}
                onChangeText={setFName}
                containerStyle={{ marginBottom: 10 }}
                autoFocus={activeId === null}
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => rServingsRef.current?.focus()}
              />
              <View style={styles.editRow3}>
                <View style={{ flex: 1 }}>
                  <HennaInput
                    ref={rServingsRef}
                    label="Servings"
                    placeholder="4"
                    value={fServings}
                    onChangeText={setFServings}
                    keyboardType="numeric"
                    returnKeyType="next"
                    blurOnSubmit={false}
                    onSubmitEditing={() => rPrepRef.current?.focus()}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <HennaInput
                    ref={rPrepRef}
                    label="Prep (min)"
                    placeholder="0"
                    value={fPrep}
                    onChangeText={setFPrep}
                    keyboardType="numeric"
                    returnKeyType="next"
                    blurOnSubmit={false}
                    onSubmitEditing={() => rCookRef.current?.focus()}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <HennaInput
                    ref={rCookRef}
                    label="Cook (min)"
                    placeholder="0"
                    value={fCook}
                    onChangeText={setFCook}
                    keyboardType="numeric"
                    returnKeyType="next"
                    blurOnSubmit={false}
                    onSubmitEditing={() => rNotesRef.current?.focus()}
                  />
                </View>
              </View>
              <HennaInput
                ref={rNotesRef}
                label="Notes (optional)"
                placeholder="tips, tricks"
                value={fNotes}
                onChangeText={setFNotes}
                multiline
                containerStyle={{ marginTop: 10 }}
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => ingNameRef.current?.focus()}
              />
            </HennaCard>

            <Text style={[hennaTextStyles.eyebrow, { marginBottom: 10 }]}>
              Ingredients · {fIngredients.length}
            </Text>
            <HennaCard padding={18} style={{ marginBottom: 14 }}>
              {fIngredients.length === 0 && (
                <Text style={styles.emptyIng}>No ingredients yet.</Text>
              )}
              {fIngredients.map((ing, i) => (
                <View
                  key={i}
                  style={[
                    styles.editIngRow,
                    i < fIngredients.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: hennaColors.line,
                    },
                  ]}
                >
                  <Text style={styles.ingName} numberOfLines={1}>
                    {ing.name}
                  </Text>
                  <Text style={styles.ingQty}>
                    {ing.qty} {ing.unit}
                  </Text>
                  <Pressable
                    onPress={() => removeIngredient(i)}
                    style={styles.smallDelBtn}
                    hitSlop={8}
                    accessibilityLabel={`Remove ${ing.name}`}
                  >
                    <HennaIcon name="close" size={14} color={hennaColors.henna} />
                  </Pressable>
                </View>
              ))}

              <View style={styles.addIngRow}>
                <View style={{ flex: 2 }}>
                  <HennaInput
                    ref={ingNameRef}
                    placeholder="Name"
                    value={ingName}
                    onChangeText={setIngName}
                    returnKeyType="next"
                    blurOnSubmit={false}
                    onSubmitEditing={() => ingQtyRef.current?.focus()}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <HennaInput
                    ref={ingQtyRef}
                    placeholder="Qty"
                    value={ingQty}
                    onChangeText={setIngQty}
                    keyboardType="numeric"
                    returnKeyType="next"
                    blurOnSubmit={false}
                    onSubmitEditing={() => ingUnitRef.current?.focus()}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <HennaInput
                    ref={ingUnitRef}
                    placeholder="Unit"
                    value={ingUnit}
                    onChangeText={setIngUnit}
                    returnKeyType="done"
                    onSubmitEditing={addIngredientToForm}
                  />
                </View>
              </View>
              <HennaButton
                title="+ Add ingredient"
                variant="outline"
                size="sm"
                onPress={addIngredientToForm}
                style={{ alignSelf: 'flex-start', marginTop: 10 }}
              />
            </HennaCard>

            <Text style={[hennaTextStyles.eyebrow, { marginBottom: 10 }]}>
              Steps · {fSteps.length}
            </Text>
            <HennaCard padding={18} style={{ marginBottom: 14 }}>
              {fSteps.map((s, i) => (
                <View key={i} style={styles.editStepRow}>
                  <View style={styles.stepNum}>
                    <Text style={styles.stepNumText}>{i + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <HennaInput
                      placeholder={`Step ${i + 1}`}
                      value={s}
                      onChangeText={t => updateStep(i, t)}
                      multiline
                    />
                  </View>
                  <Pressable
                    onPress={() => removeStep(i)}
                    style={styles.smallDelBtn}
                    hitSlop={8}
                    accessibilityLabel={`Remove step ${i + 1}`}
                  >
                    <HennaIcon name="close" size={14} color={hennaColors.henna} />
                  </Pressable>
                </View>
              ))}
              <HennaButton
                title="+ Add step"
                variant="outline"
                size="sm"
                onPress={addStep}
                style={{ alignSelf: 'flex-start', marginTop: 8 }}
              />
            </HennaCard>

            <View style={styles.detailActions}>
              <HennaButton
                title="Cancel"
                variant="outline"
                onPress={() => (activeId !== null ? setMode('detail') : backToList())}
                style={{ flex: 1 }}
              />
              <HennaButton title="Save recipe" variant="primary" onPress={saveRecipeEdit} style={{ flex: 1 }} />
            </View>
          </View>
        </ScrollView>
        <Toast toast={toast} dismiss={dismissToast} />
      </View>
    );
  }

  // ── LIST VIEW ──
  return (
    <View style={styles.container}>
      <LinearGradient colors={hennaGradients.page} style={StyleSheet.absoluteFill} />
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top, paddingBottom: 180 }]}
        showsVerticalScrollIndicator={false}
      >
        <HennaHeader title="Recipe Book" subtitle={`${recipes.length} recipes`} onMenu={onMenu} />

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
                  Your kitchen
                </Text>
              </View>
              <Text style={styles.heroNum}>{recipes.length}</Text>
              <Text style={styles.heroSub}>
                {pickTitle || (recipes.length === 0 ? 'No recipes yet' : 'Saved recipes')}
              </Text>
              <View style={{ marginTop: 14 }}>
                <HennaButton title="+ New recipe" icon="plus" variant="bronze" size="sm" onPress={startNewRecipe} />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.searchRow}>
          <View style={{ flex: 1 }}>
            <HennaInput icon="search" placeholder="Search recipes" value={search} onChangeText={setSearch} />
          </View>
        </View>

        {pickForMeal && (
          <View style={{ paddingHorizontal: 16, marginTop: 6 }}>
            <HennaCard padding={14} accent="bronze">
              <Text style={styles.pickBanner}>
                Picking for {pickForMeal.day} · {pickForMeal.meal}
              </Text>
            </HennaCard>
          </View>
        )}

        {!allLoaded && (
          <View style={{ paddingHorizontal: 16, marginTop: 14 }}>
            <SkeletonCardRow />
            <SkeletonCardRow />
            <SkeletonCardRow />
          </View>
        )}

        {allLoaded && filtered.length === 0 && (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>
              {recipes.length === 0 ? "Let's cook something." : 'Nothing matches that search.'}
            </Text>
            <Text style={styles.emptyHint}>
              {recipes.length === 0 ? 'Tap + to save your first recipe.' : ''}
            </Text>
          </View>
        )}

        {allLoaded && filtered.length > 0 && (
          <View style={styles.listWrap}>
            {filtered.map(r => {
              const totalTime = r.prepMinutes + r.cookMinutes;
              return (
                <HennaCard
                  key={r.id}
                  onPress={() => openDetail(r.id)}
                  padding={18}
                  style={{ marginBottom: 12 }}
                >
                  <Text style={styles.cardName} numberOfLines={1}>{r.name}</Text>
                  <Text style={styles.cardMeta}>
                    Serves {r.servings} · {totalTime > 0 ? `${totalTime} min` : '—'} · {r.ingredients.length} ingredients
                  </Text>
                  {r.notes ? (
                    <Text style={styles.cardNotes} numberOfLines={2}>
                      {r.notes}
                    </Text>
                  ) : null}
                </HennaCard>
              );
            })}
          </View>
        )}
      </ScrollView>
      <Toast toast={toast} dismiss={dismissToast} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 180 },
  headerIconBtn: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  // Hero
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
    fontSize: 36,
    color: hennaColors.ink,
    letterSpacing: -0.5,
  },
  heroName: {
    marginTop: 6,
    fontFamily: hennaFonts.serif,
    fontSize: 24,
    color: hennaColors.ink,
    letterSpacing: -0.3,
  },
  heroSub: { marginTop: 6, fontFamily: hennaFonts.ui, fontSize: 12, color: hennaColors.ink2 },

  // List
  searchRow: { paddingHorizontal: 16, marginTop: 18 },
  listWrap: { paddingHorizontal: 16, marginTop: 12 },
  cardName: { fontFamily: hennaFonts.serif, fontSize: 18, color: hennaColors.ink, marginBottom: 4 },
  cardMeta: { fontFamily: hennaFonts.ui, fontSize: 12, color: hennaColors.muted, marginBottom: 6 },
  cardNotes: {
    fontFamily: hennaFonts.ui,
    fontSize: 12,
    fontStyle: 'italic',
    color: hennaColors.ink2,
  },

  pickBanner: { fontFamily: hennaFonts.uiSemi, fontSize: 13, color: hennaColors.bronze, textAlign: 'center' },

  // Detail
  detailStatsRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
  },
  statVal: { fontFamily: hennaFonts.serif, fontSize: 18 },
  statLbl: {
    marginTop: 2,
    fontFamily: hennaFonts.uiSemi,
    fontSize: 10,
    color: hennaColors.muted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  detailActions: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 6,
  },

  body: { paddingHorizontal: 16 },
  sectionEyebrow: { paddingHorizontal: 24, paddingBottom: 10, paddingTop: 10 },

  ingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  ingName: { flex: 1, fontFamily: hennaFonts.uiSemi, fontSize: 14, color: hennaColors.ink },
  ingRight: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  ingQty: { fontFamily: hennaFonts.ui, fontSize: 12, color: hennaColors.ink2 },
  stepRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: hennaColors.bronzeBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: { fontFamily: hennaFonts.uiSemi, fontSize: 12, color: hennaColors.bronze },
  stepText: { flex: 1, fontFamily: hennaFonts.ui, fontSize: 13, color: hennaColors.ink, lineHeight: 20 },
  notesText: {
    fontFamily: hennaFonts.ui,
    fontSize: 13,
    color: hennaColors.ink2,
    fontStyle: 'italic',
    lineHeight: 20,
  },

  // Edit
  editRow3: { flexDirection: 'row', gap: 8 },
  editIngRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  addIngRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  editStepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  emptyIng: { fontFamily: hennaFonts.ui, fontSize: 12, color: hennaColors.muted, fontStyle: 'italic' },
  smallDelBtn: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: hennaColors.hennaBg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(60,40,20,0.45)',
    justifyContent: 'center',
    padding: 20,
  },
  modalBox: {
    backgroundColor: hennaColors.pearl,
    borderRadius: 24,
    padding: 22,
  },
  modalTitle: { fontFamily: hennaFonts.serif, fontSize: 20, color: hennaColors.ink, marginBottom: 6 },
  modalSub: { fontFamily: hennaFonts.ui, fontSize: 12, color: hennaColors.ink2 },
  targetOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: hennaColors.paper,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: hennaColors.line,
  },
  targetName: { flex: 1, fontFamily: hennaFonts.uiSemi, fontSize: 13, color: hennaColors.ink },
  targetMeta: { fontFamily: hennaFonts.ui, fontSize: 11, color: hennaColors.muted },

  sparkleOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 500,
  },

  emptyWrap: { paddingHorizontal: 24, paddingVertical: 32, alignItems: 'center' },
  emptyTitle: { fontFamily: hennaFonts.serif, fontSize: 18, color: hennaColors.ink, textAlign: 'center' },
  emptyHint: { marginTop: 8, fontFamily: hennaFonts.ui, fontSize: 12, color: hennaColors.muted, textAlign: 'center' },
});
