// Supported currencies for ForSHE. The app defaults to PKR and falls back to it
// if an unknown code is ever read from storage. Add more by appending to the
// array — every entry is a narrow, immutable tuple so TS can catch typos.

export interface CurrencyDef {
  code: string;
  symbol: string;
  name: string;
  locale: string;
}

export const CURRENCIES: readonly CurrencyDef[] = [
  { code: 'PKR', symbol: 'Rs', name: 'Pakistani Rupee', locale: 'en-PK' },
  { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US' },
  { code: 'EUR', symbol: '€', name: 'Euro', locale: 'en-IE' },
  { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', locale: 'en-IN' },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal', locale: 'en-US' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', locale: 'en-US' },
] as const;

export const DEFAULT_CURRENCY_CODE = 'PKR';

export function findCurrency(code: string | undefined | null): CurrencyDef {
  if (!code) return CURRENCIES[0];
  const hit = CURRENCIES.find(c => c.code === code);
  return hit ?? CURRENCIES[0];
}
