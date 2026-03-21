import * as Notifications from 'expo-notifications';

export async function checkBudgetAlert(monthSpent: number, budget: number): Promise<void> {
  if (budget <= 0) return;

  const pct = Math.round((monthSpent / budget) * 100);

  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return;

    if (pct >= 100) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🚨 Budget Exceeded!',
          body: `You've spent Rs ${monthSpent.toLocaleString()} — that's ${pct}% of your Rs ${budget.toLocaleString()} budget.`,
        },
        trigger: null, // send immediately
      });
    } else if (pct >= 80) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '⚠️ Budget Warning',
          body: `You've used ${pct}% of your monthly budget (Rs ${monthSpent.toLocaleString()} of Rs ${budget.toLocaleString()}).`,
        },
        trigger: null,
      });
    }
  } catch {
    // silently fail
  }
}
