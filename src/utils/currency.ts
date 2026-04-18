// Multi-currency formatters.
// Both functions preserve the sign so callers can show negative balances directly.
// Pass `Math.abs(n)` if you need an unsigned display.
//
// Prefer the hook `useCurrency()` / helpers exposed via `CurrencyContext` in
// screens — these raw helpers exist for places that cannot use hooks (e.g.
// utility files like `share.ts`) and for legacy callers. They accept the
// currency def explicitly; the legacy single-argument form still works and
// defaults to PKR for backwards compatibility.

import { CurrencyDef, CURRENCIES } from '../constants/currencies';

const PKR = CURRENCIES[0];

// Short form — Rs 12K / Rs 1.2L / Rs 500
export function pkr(n: number, cur: CurrencyDef = PKR): string {
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  const sym = cur.symbol;
  // Keep lakh shorthand for PKR/INR only (the two South Asian currencies).
  if ((cur.code === 'PKR' || cur.code === 'INR') && abs >= 100000) {
    return sign + sym + ' ' + (abs / 100000).toFixed(1) + 'L';
  }
  if (abs >= 1_000_000) return sign + sym + ' ' + (abs / 1_000_000).toFixed(1) + 'M';
  if (abs >= 1000) return sign + sym + ' ' + (abs / 1000).toFixed(1) + 'K';
  return sign + sym + ' ' + Math.round(abs);
}

// Full form — Rs 12,500 or $12,500
export function pkrF(n: number, cur: CurrencyDef = PKR): string {
  const sign = n < 0 ? '-' : '';
  try {
    return sign + cur.symbol + ' ' + Math.round(Math.abs(n)).toLocaleString(cur.locale);
  } catch {
    return sign + cur.symbol + ' ' + Math.round(Math.abs(n));
  }
}
