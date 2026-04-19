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
import { useRoute, useNavigation } from '@react-navigation/native';
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
import { LottieBox } from '../components/ui/LottieBox';
import { Recipe, RecipeIngredient, ShoppingSession, ShoppingItem } from '../types';
import { todayDay } from '../utils/dates';
import { SkeletonCardRow } from '../components/ui/Skeleton';

type Mode = 'list' | 'detail' | 'edit';

interface RouteParams {
  pickForMeal?: { day: string; meal: string };  // when CookingScreen opens in "pick" mode
}

export default function RecipeBookScreen() {
  const { colors, dark } = useTheme();
  const insets = useSafeAreaInsets();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { recipes, setRecipes, inventory, setInventory, setCooking, shoppingSessions, setShoppingSessions, allLoaded } = useData();
  const { toast, show: showToast, dismiss: dismissToast } = useToast();

  const pickForMeal: RouteParams['pickForMeal'] = route.params?.pickForMeal;

  const [mode, setMode] = useState<Mode>('list');
  const [activeId, setActiveId] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  // v1.2.4-dev: one-shot sparkle overlay when the user taps "Cook this".
  // LottieBox enforces loop={false}; auto-dismisses on animation finish.
  const [cookSparkleVisible, setCookSparkleVisible] = useState(false);

  // Edit form state
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

  // v1.2.5-dev: keyboard flow refs for the recipe edit form.
  const rNameRef = useRef<TextInput | null>(null);
  const rServingsRef = useRef<TextInput | null>(null);
  const rPrepRef = useRef<TextInput | null>(null);
  const rCookRef = useRef<TextInput | null>(null);
  const rNotesRef = useRef<TextInput | null>(null);
  const ingNameRef = useRef<TextInput | null>(null);
  const ingQtyRef = useRef<TextInput | null>(null);
  const ingUnitRef = useRef<TextInput | null>(null);

  // Shopping-target picker modal
  const [shoppingModal, setShoppingModal] = useState<{ visible: boolean; missing: RecipeIngredient[] }>({
    visible: false,
    missing: [],
  });

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

  // --- List actions ---
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

  const deleteRecipe = useCallback((r: Recipe) => {
    Alert.alert('Delete Recipe', `Delete "${r.name}"? This can be undone from the toast.`, [
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
  }, [setRecipes, showToast, backToList]);

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
    setFSteps(prev => prev.map((s, i) => i === idx ? text : s));
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
          ? { ...r, name: fName.trim(), servings, prepMinutes: prep, cookMinutes: cook, notes: fNotes.trim() || undefined, ingredients: fIngredients, steps: cleanSteps }
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

  // --- Integration: pick this recipe for a cooking slot ---
  const pickRecipeForMeal = useCallback((r: Recipe) => {
    if (!pickForMeal) return;
    const key = `${pickForMeal.day}_${pickForMeal.meal}`;
    setCooking(c => ({ ...c, [key]: r.name }));
    Haptics.selectionAsync();
    showToast(`${r.name} set for ${pickForMeal.meal}`);
    // Return to cooking screen
    setTimeout(() => navigation.goBack(), 400);
  }, [pickForMeal, setCooking, navigation, showToast]);

  // --- Integration: "Cook this" (log meal for today + deduct from inventory) ---
  const cookRecipe = useCallback((r: Recipe) => {
    // 1. Log meal for today (time-of-day heuristic)
    const day = todayDay();
    const now = new Date();
    const hr = now.getHours();
    const meal = hr < 11 ? 'Breakfast' : hr < 16 ? 'Lunch' : 'Dinner';
    const key = `${day}_${meal}`;
    setCooking(c => ({ ...c, [key]: r.name }));

    // 2. Deduct from inventory — only when name + unit match exactly.
    // No unit conversion; ingredients with mismatched units are skipped silently.
    setInventory(prev => prev.map(inv => {
      const ing = r.ingredients.find(x =>
        x.name.toLowerCase() === inv.name.toLowerCase() && x.unit === inv.unit,
      );
      if (!ing) return inv;
      const nextQty = Math.max(0, inv.qty - ing.qty);
      return { ...inv, qty: nextQty, lastUpdated: new Date().toISOString() };
    }));

    showToast(`🍽️ Cooking ${r.name} — logged for ${meal}`);
    Haptics.selectionAsync();
    setCookSparkleVisible(true);
  }, [setCooking, setInventory, showToast]);

  // --- Integration: Add missing ingredients to shopping list ---
  const computeMissing = useCallback((r: Recipe): RecipeIngredient[] => {
    return r.ingredients.filter(ing => {
      const inv = inventory.find(i =>
        i.name.toLowerCase() === ing.name.toLowerCase() && i.unit === ing.unit,
      );
      if (!inv) return true; // not in inventory = missing
      return inv.qty < ing.qty; // insufficient qty
    }).map(ing => {
      const inv = inventory.find(i =>
        i.name.toLowerCase() === ing.name.toLowerCase() && i.unit === ing.unit,
      );
      const needed = inv ? ing.qty - inv.qty : ing.qty;
      return { ...ing, qty: needed };
    });
  }, [inventory]);

  const openShoppingModal = useCallback((r: Recipe) => {
    const missing = computeMissing(r);
    if (missing.length === 0) {
      showToast('All ingredients in stock!');
      return;
    }
    setShoppingModal({ visible: true, missing });
  }, [computeMissing, showToast]);

  const appendToSession = useCallback((sessionId: number, missing: RecipeIngredient[]) => {
    setShoppingSessions(prev => prev.map(s => {
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
    }));
    setShoppingModal({ visible: false, missing: [] });
    showToast(missing.length + ' items added');
  }, [setShoppingSessions, showToast]);

  const createNewSessionFromMissing = useCallback((missing: RecipeIngredient[], name: string) => {
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
  }, [setShoppingSessions, showToast]);

  // --- Meal slot helper for "Pick for Meal" header ---
  const pickTitle = useMemo(() => {
    if (!pickForMeal) return null;
    return `Pick a recipe for ${pickForMeal.day} · ${pickForMeal.meal}`;
  }, [pickForMeal]);

  // --- DETAIL VIEW ---
  if (mode === 'detail' && activeRecipe) {
    const totalTime = activeRecipe.prepMinutes + activeRecipe.cookMinutes;
    const missing = computeMissing(activeRecipe);
    return (
      <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.container}>
        <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]} showsVerticalScrollIndicator={false}>
          <Card gradient={dark ? gradients.goldHeroDark : gradients.goldHero}>
            <View style={styles.heroHeaderRow}>
              <DrawerMenuButton />
              <View style={styles.heroHeaderText}>
                <Text style={[styles.heroLabel, { color: colors.gold }]}>📖 Recipe</Text>
                <Text style={[styles.heroName, { color: colors.deep }]}>{activeRecipe.name}</Text>
                <Text style={[styles.heroSub, { color: colors.sub }]}>
                  Serves {activeRecipe.servings} · {totalTime > 0 ? `${totalTime} min` : 'No timing set'}
                </Text>
              </View>
            </View>
          </Card>

          <View style={styles.detailStatsRow}>
            <View style={[styles.statBox, { backgroundColor: colors.bg2 }]}>
              <Text style={[styles.statVal, { color: colors.gold }]}>{activeRecipe.prepMinutes}</Text>
              <Text style={[styles.statLbl, { color: colors.muted }]}>Prep min</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: colors.bg2 }]}>
              <Text style={[styles.statVal, { color: colors.green }]}>{activeRecipe.cookMinutes}</Text>
              <Text style={[styles.statLbl, { color: colors.muted }]}>Cook min</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: colors.bg2 }]}>
              <Text style={[styles.statVal, { color: colors.blue }]}>{activeRecipe.servings}</Text>
              <Text style={[styles.statLbl, { color: colors.muted }]}>Servings</Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.detailActions}>
            <Button title="← Back" variant="outline" onPress={backToList} style={{ flex: 1 }} />
            {pickForMeal ? (
              <Button title="✓ Pick" variant="gold" onPress={() => pickRecipeForMeal(activeRecipe)} style={{ flex: 1 }} />
            ) : (
              <Button title="🍽️ Cook" variant="gold" onPress={() => cookRecipe(activeRecipe)} style={{ flex: 1 }} />
            )}
          </View>

          {!pickForMeal && (
            <Button
              title={missing.length > 0 ? `🛒 Add ${missing.length} missing to shopping` : '✅ All ingredients in stock'}
              variant={missing.length > 0 ? 'green' : 'outline'}
              onPress={() => openShoppingModal(activeRecipe)}
              style={{ marginBottom: 12 }}
            />
          )}

          {/* Ingredients */}
          <Divider label={`Ingredients · ${activeRecipe.ingredients.length}`} />
          <Card>
            {activeRecipe.ingredients.map((ing, i) => {
              const inv = inventory.find(x => x.name.toLowerCase() === ing.name.toLowerCase() && x.unit === ing.unit);
              const inStock = inv && inv.qty >= ing.qty;
              const missingQty = inv ? Math.max(0, ing.qty - inv.qty) : ing.qty;
              return (
                <View
                  key={i}
                  style={[
                    styles.ingRow,
                    i < activeRecipe.ingredients.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                  ]}
                >
                  <Text style={[styles.ingName, { color: colors.deep }]}>{ing.name}</Text>
                  <View style={styles.ingRight}>
                    <Text style={[styles.ingQty, { color: colors.sub }]}>{ing.qty} {ing.unit}</Text>
                    {inStock ? (
                      <Badge text="In stock" bg={colors.greenBg} color={colors.green} />
                    ) : (
                      <Badge text={inv ? `Need ${missingQty} ${ing.unit}` : 'Missing'} bg={colors.redBg} color={colors.red} />
                    )}
                  </View>
                </View>
              );
            })}
          </Card>

          {/* Steps */}
          {activeRecipe.steps.length > 0 && (
            <>
              <Divider label="Steps" />
              <Card>
                {activeRecipe.steps.map((step, i) => (
                  <View key={i} style={styles.stepRow}>
                    <View style={[styles.stepNum, { backgroundColor: colors.goldBg }]}>
                      <Text style={[styles.stepNumText, { color: colors.gold }]}>{i + 1}</Text>
                    </View>
                    <Text style={[styles.stepText, { color: colors.sub }]}>{step}</Text>
                  </View>
                ))}
              </Card>
            </>
          )}

          {activeRecipe.notes ? (
            <>
              <Divider label="Notes" />
              <Card>
                <Text style={[styles.notesText, { color: colors.sub }]}>{activeRecipe.notes}</Text>
              </Card>
            </>
          ) : null}

          {/* Management */}
          <View style={styles.detailActions}>
            <Button title="✏️ Edit" variant="outline" onPress={() => startEditRecipe(activeRecipe)} style={{ flex: 1 }} />
            <Button title="🗑 Delete" variant="outline" onPress={() => deleteRecipe(activeRecipe)} style={{ flex: 1 }} />
          </View>

          <View style={styles.bottomPad} />
        </ScrollView>

        {/* Shopping target modal */}
        <Modal visible={shoppingModal.visible} transparent animationType="fade" onRequestClose={() => setShoppingModal({ visible: false, missing: [] })}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalBox, { backgroundColor: colors.bg2 }]}>
              <Text style={[styles.modalTitle, { color: colors.deep }]}>
                Add {shoppingModal.missing.length} missing items
              </Text>
              <Text style={[styles.modalSub, { color: colors.sub }]}>Where should these go?</Text>
              <View style={{ height: 12 }} />

              {shoppingSessions.filter(s => !s.completed).length > 0 && (
                <>
                  <Text style={[styles.sectionLabel, { color: colors.muted }]}>ACTIVE LISTS</Text>
                  {shoppingSessions.filter(s => !s.completed).slice(0, 4).map(s => (
                    <TouchableOpacity
                      key={s.id}
                      style={[styles.targetOption, { backgroundColor: colors.bg3 }]}
                      onPress={() => appendToSession(s.id, shoppingModal.missing)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.targetName, { color: colors.deep }]} numberOfLines={1}>{s.name}</Text>
                      <Text style={[styles.targetMeta, { color: colors.muted }]}>{s.items.length} items</Text>
                    </TouchableOpacity>
                  ))}
                </>
              )}

              <Button
                title={`+ New list from "${activeRecipe.name}"`}
                variant="green"
                onPress={() => createNewSessionFromMissing(shoppingModal.missing, activeRecipe.name)}
                style={{ marginTop: 12 }}
              />
              <Button
                title="Cancel"
                variant="outline"
                small
                onPress={() => setShoppingModal({ visible: false, missing: [] })}
                style={{ marginTop: 10, alignSelf: 'flex-start' }}
              />
            </View>
          </View>
        </Modal>

        <Toast toast={toast} dismiss={dismissToast} />

        {/* v1.2.4-dev: sparkle Lottie overlay fires once on "Cook this". */}
        {cookSparkleVisible && (
          <View style={styles.sparkleOverlay} pointerEvents="none">
            <LottieBox
              animation="sparkle"
              size={180}
              fallbackEmoji="🍽️"
              onAnimationFinish={() => setCookSparkleVisible(false)}
            />
          </View>
        )}
      </LinearGradient>
    );
  }

  // --- EDIT / NEW VIEW ---
  if (mode === 'edit') {
    return (
      <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.container}>
        <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Card gradient={dark ? gradients.goldHeroDark : gradients.goldHero}>
            <View style={styles.heroHeaderRow}>
              <DrawerMenuButton />
              <View style={styles.heroHeaderText}>
                <Text style={[styles.heroLabel, { color: colors.gold }]}>📖 Recipe</Text>
                <Text style={[styles.heroName, { color: colors.deep }]}>
                  {activeId !== null ? 'Edit recipe' : 'New recipe'}
                </Text>
              </View>
            </View>
          </Card>

          <Card>
            <Input
              ref={rNameRef}
              label="Name"
              placeholder="e.g. Chicken Biryani"
              value={fName}
              onChangeText={setFName}
              style={{ marginBottom: 10 }}
              autoFocus={activeId === null}
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => rServingsRef.current?.focus()}
            />
            <View style={styles.editRow3}>
              <View style={{ flex: 1 }}>
                <Input
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
                <Input
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
                <Input
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
            <Input
              ref={rNotesRef}
              label="Notes (optional)"
              placeholder="tips / tricks"
              value={fNotes}
              onChangeText={setFNotes}
              multiline
              style={{ marginTop: 10 }}
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => ingNameRef.current?.focus()}
            />
          </Card>

          <Divider label={`Ingredients · ${fIngredients.length}`} />
          <Card>
            {fIngredients.length === 0 && (
              <Text style={[styles.emptyIng, { color: colors.muted }]}>No ingredients yet.</Text>
            )}
            {fIngredients.map((ing, i) => (
              <View
                key={i}
                style={[
                  styles.editIngRow,
                  i < fIngredients.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                ]}
              >
                <Text style={[styles.ingName, { color: colors.deep }]} numberOfLines={1}>{ing.name}</Text>
                <Text style={[styles.ingQty, { color: colors.sub }]}>{ing.qty} {ing.unit}</Text>
                <TouchableOpacity
                  onPress={() => removeIngredient(i)}
                  style={[styles.smallDelBtn, { backgroundColor: colors.redBg }]}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityLabel={`Remove ${ing.name}`}
                >
                  <Text style={[styles.smallDelText, { color: colors.red }]}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}

            <View style={styles.addIngRow}>
              <View style={{ flex: 2 }}>
                <Input
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
                <Input
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
                <Input
                  ref={ingUnitRef}
                  placeholder="Unit"
                  value={ingUnit}
                  onChangeText={setIngUnit}
                  returnKeyType="done"
                  onSubmitEditing={addIngredientToForm}
                />
              </View>
            </View>
            <Button title="+ Add Ingredient" variant="outline" small onPress={addIngredientToForm} style={{ alignSelf: 'flex-start', marginTop: 10 }} />
          </Card>

          <Divider label={`Steps · ${fSteps.length}`} />
          <Card>
            {fSteps.map((s, i) => (
              <View key={i} style={styles.editStepRow}>
                <View style={[styles.stepNum, { backgroundColor: colors.goldBg, marginTop: 10 }]}>
                  <Text style={[styles.stepNumText, { color: colors.gold }]}>{i + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Input
                    placeholder={`Step ${i + 1}`}
                    value={s}
                    onChangeText={(t) => updateStep(i, t)}
                    multiline
                  />
                </View>
                <TouchableOpacity
                  onPress={() => removeStep(i)}
                  style={[styles.smallDelBtn, { backgroundColor: colors.redBg, marginTop: 10 }]}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityLabel={`Remove step ${i + 1}`}
                >
                  <Text style={[styles.smallDelText, { color: colors.red }]}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
            <Button title="+ Add Step" variant="outline" small onPress={addStep} style={{ alignSelf: 'flex-start', marginTop: 8 }} />
          </Card>

          <View style={styles.detailActions}>
            <Button title="Cancel" variant="outline" onPress={() => { activeId !== null ? setMode('detail') : backToList(); }} style={{ flex: 1 }} />
            <Button title="Save Recipe" variant="gold" onPress={saveRecipeEdit} style={{ flex: 1 }} />
          </View>

          <View style={styles.bottomPad} />
        </ScrollView>
        <Toast toast={toast} dismiss={dismissToast} />
      </LinearGradient>
    );
  }

  // --- LIST VIEW ---
  return (
    <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.container}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]} showsVerticalScrollIndicator={false}>
        <Card gradient={dark ? gradients.goldHeroDark : gradients.goldHero}>
          <View style={styles.heroHeaderRow}>
            <DrawerMenuButton />
            <View style={styles.heroHeaderText}>
              <Text style={[styles.heroLabel, { color: colors.gold }]}>📖 Recipe Book</Text>
              <Text style={[styles.heroNum, { color: colors.gold }]}>{recipes.length}</Text>
              <Text style={[styles.heroSub, { color: colors.sub }]}>
                {pickTitle || (recipes.length === 0 ? 'No recipes yet' : 'Your saved recipes')}
              </Text>
            </View>
          </View>
        </Card>

        <View style={styles.searchRow}>
          <View style={{ flex: 1 }}>
            <Input placeholder="Search recipes…" value={search} onChangeText={setSearch} />
          </View>
          <Button title="+ New" variant="gold" onPress={startNewRecipe} />
        </View>

        {pickForMeal && (
          <Card style={{ backgroundColor: colors.goldBg }}>
            <Text style={[styles.pickBanner, { color: colors.gold }]}>
              🍳 Picking for {pickForMeal.day} · {pickForMeal.meal}
            </Text>
          </Card>
        )}

        {!allLoaded && (
          <>
            <SkeletonCardRow />
            <SkeletonCardRow />
            <SkeletonCardRow />
          </>
        )}

        {allLoaded && filtered.length === 0 && (
          <EmptyState
            icon="📖"
            text={recipes.length === 0
              ? "Let’s cook something. Tap + to save your first recipe."
              : 'Nothing matches that search.'}
            hint={recipes.length === 0 ? 'Or explore the 6 starters we included.' : undefined}
          />
        )}

        {allLoaded && filtered.map(r => {
          const totalTime = r.prepMinutes + r.cookMinutes;
          return (
            <Card key={r.id}>
              <TouchableOpacity onPress={() => openDetail(r.id)} activeOpacity={0.7}>
                <Text style={[styles.cardName, { color: colors.deep }]} numberOfLines={1}>{r.name}</Text>
                <Text style={[styles.cardMeta, { color: colors.muted }]}>
                  Serves {r.servings} · {totalTime > 0 ? `${totalTime} min` : '—'} · {r.ingredients.length} ingredients
                </Text>
                {r.notes ? (
                  <Text style={[styles.cardNotes, { color: colors.sub }]} numberOfLines={2}>
                    {r.notes}
                  </Text>
                ) : null}
              </TouchableOpacity>
            </Card>
          );
        })}

        <View style={styles.bottomPad} />
      </ScrollView>
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
  heroName: { fontFamily: 'PlayfairDisplay-ExtraBold', fontSize: 26, lineHeight: 32 },
  heroSub: { fontSize: 14, fontFamily: 'Outfit-Regular', marginTop: 4 },
  searchRow: { flexDirection: 'row', gap: 10, marginBottom: 12, alignItems: 'center' },
  cardName: { fontSize: 18, fontFamily: 'Outfit-Bold', marginBottom: 4 },
  cardMeta: { fontSize: 13, fontFamily: 'Outfit-Regular', marginBottom: 6 },
  cardNotes: { fontSize: 13, fontFamily: 'Outfit-Regular', fontStyle: 'italic' },
  pickBanner: { fontSize: 13, fontFamily: 'Outfit-SemiBold', textAlign: 'center' },
  detailStatsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statBox: { flex: 1, borderRadius: 16, padding: 14, alignItems: 'center' },
  statVal: { fontSize: 22, fontFamily: 'Outfit-Bold' },
  statLbl: { fontSize: 11, fontFamily: 'Outfit-SemiBold', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 2 },
  sparkleOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center', zIndex: 500,
  },
  detailActions: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  ingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  ingName: { flex: 1, fontSize: 15, fontFamily: 'Outfit-SemiBold', minWidth: 0 },
  ingRight: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  ingQty: { fontSize: 14, fontFamily: 'Outfit-Regular' },
  stepRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  stepNum: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { fontSize: 14, fontFamily: 'Outfit-Bold' },
  stepText: { flex: 1, fontSize: 14, fontFamily: 'Outfit-Regular', lineHeight: 22 },
  notesText: { fontSize: 14, fontFamily: 'Outfit-Regular', lineHeight: 22, fontStyle: 'italic' },
  editRow3: { flexDirection: 'row', gap: 8 },
  editIngRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  addIngRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  editStepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  emptyIng: { fontSize: 13, fontFamily: 'Outfit-Regular', fontStyle: 'italic' },
  smallDelBtn: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  smallDelText: { fontSize: 14, fontFamily: 'Outfit-Bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 24 },
  modalBox: { borderRadius: 24, padding: 22 },
  modalTitle: { fontSize: 20, fontFamily: 'PlayfairDisplay-Bold', marginBottom: 6 },
  modalSub: { fontSize: 13, fontFamily: 'Outfit-Regular' },
  sectionLabel: { fontSize: 11, fontFamily: 'Outfit-Bold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 6 },
  targetOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 8 },
  targetName: { flex: 1, fontSize: 15, fontFamily: 'Outfit-SemiBold' },
  targetMeta: { fontSize: 12, fontFamily: 'Outfit-Regular' },
  bottomPad: { height: 40 },
});

