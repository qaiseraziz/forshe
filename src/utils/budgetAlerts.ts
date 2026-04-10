import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

function currentMonthKey(level: number): string {
  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return `forshe_budget_alert_${level}_${ym}`;
}

export async function checkBudgetAlert(monthSpent: number, budget: number): Promise<void> {
  if (budget <= 0) return;

  const pct = Math.round((monthSpent / budget) * 100);

  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return;

    if (pct >= 100) {
      const key100 = currentMonthKey(100);
      const already100 = await AsyncStorage.getItem(key100);
      if (already100) return;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🚨 Budget Exceeded!',
          body: `You've spent Rs ${monthSpent.toLocaleString()} — that's ${pct}% of your Rs ${budget.toLocaleString()} budget.`,
        },
        trigger: null, // send immediately
      });
      await AsyncStorage.setItem(key100, '1');
    } else if (pct >= 80) {
      const key80 = currentMonthKey(80);
      const already80 = await AsyncStorage.getItem(key80);
      if (already80) return;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '⚠️ Budget Warning',
          body: `You've used ${pct}% of your monthly budget (Rs ${monthSpent.toLocaleString()} of Rs ${budget.toLocaleString()}).`,
        },
        trigger: null,
      });
      await AsyncStorage.setItem(key80, '1');
    }
  } catch {
    // silently fail
  }
}
