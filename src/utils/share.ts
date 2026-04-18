import { Share, Linking, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Transaction } from '../types';
import { MONTHS } from '../constants/data';
import { pkrF } from './currency';
import { todayStr, parseDMY } from './dates';
import { CurrencyDef, CURRENCIES } from '../constants/currencies';

const DEFAULT_CUR: CurrencyDef = CURRENCIES[0];

export function buildShareText(
  history: Transaction[],
  filter: string,
  selMonth: number,
  selYear: number,
  budget: number = 0,
  currency: CurrencyDef = DEFAULT_CUR,
): string {
  const td = todayStr();
  let filtered = history;
  let label = 'All Time';

  if (filter === 'today') {
    filtered = history.filter(h => h.date === td);
    label = 'Today (' + td + ')';
  } else if (filter === 'month') {
    filtered = history.filter(h => {
      const p = parseDMY(h.date);
      return p && p.m === selMonth && p.y === selYear;
    });
    label = MONTHS[selMonth] + ' ' + selYear;
  }

  const totalRec = history.filter(h => h.type === 'topup').reduce((s, h) => s + h.amount, 0);
  const totalSpent = history.filter(h => h.type === 'expense').reduce((s, h) => s + h.amount, 0);
  const remaining = totalRec - totalSpent;
  const exps = filtered.filter(h => h.type === 'expense');
  const tops = filtered.filter(h => h.type === 'topup');
  const periodExp = exps.reduce((s, h) => s + h.amount, 0);
  const periodRec = tops.reduce((s, h) => s + h.amount, 0);

  const catMap: Record<string, number> = {};
  exps.forEach(h => { catMap[h.cat] = (catMap[h.cat] || 0) + h.amount; });
  const cats = Object.entries(catMap).sort((a, b) => b[1] - a[1]);

  const fmt = (n: number) => pkrF(n, currency);

  const line = '━'.repeat(30);
  let txt = `💜 ForSHE Expense Report\n📅 ${label}  |  📆 ${td}\n${line}\n\n`;
  txt += `💵 Total Received:\n   ${fmt(totalRec)}\n\n🛒 Total Spent:\n   ${fmt(totalSpent)}\n\n`;
  txt += `${remaining >= 0 ? '✅' : '⚠️'} Remaining Balance:\n   ${fmt(Math.abs(remaining))}${remaining < 0 ? ' (OVERSPENT)' : ''}\n`;

  if (budget > 0) {
    const now = new Date();
    const ms = history.filter(h => h.type === 'expense' && (() => {
      const p = parseDMY(h.date);
      return p && p.m === now.getMonth() && p.y === now.getFullYear();
    })()).reduce((s, h) => s + h.amount, 0);
    txt += `\n🎯 Monthly Budget: ${fmt(budget)}  |  Used: ${fmt(ms)}\n`;
  }

  if (filter !== 'all' && (periodRec > 0 || periodExp > 0)) {
    txt += `\n${line}\n📊 ${label} Breakdown:\n   Received : ${fmt(periodRec)}\n   Spent    : ${fmt(periodExp)}\n   ${periodRec - periodExp >= 0 ? 'Saved    ' : 'Deficit  '}: ${fmt(Math.abs(periodRec - periodExp))}\n`;
  }

  if (cats.length) {
    txt += `\n${line}\n📂 By Category:\n`;
    cats.forEach(c => { txt += `   ${c[0]}  →  ${fmt(c[1])}\n`; });
  }

  if (exps.length) {
    txt += `\n${line}\n🧾 Recent Expenses:\n`;
    exps.slice(0, 8).forEach(e => { txt += `   • ${e.label}  —  ${fmt(e.amount)}  (${e.date})\n`; });
    if (exps.length > 8) txt += `   ...and ${exps.length - 8} more\n`;
  }

  txt += `\n${line}\nSent from ForSHE App`;
  return txt;
}

export async function doShare(text: string, method: string) {
  const plain = text.replace(/\*/g, '').replace(/_/g, '');

  if (method === 'wa') {
    const url = 'https://api.whatsapp.com/send?text=' + encodeURIComponent(plain);
    try { await Linking.openURL(url); } catch { Alert.alert('Error', 'Could not open WhatsApp'); }
  } else if (method === 'sms') {
    const url = 'sms:?&body=' + encodeURIComponent(plain);
    try { await Linking.openURL(url); } catch { Alert.alert('Error', 'Could not open SMS'); }
  } else if (method === 'copy') {
    await Clipboard.setStringAsync(plain);
  } else if (method === 'share') {
    await Share.share({ message: plain });
  }
}
