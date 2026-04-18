import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { useStorage } from '../hooks/useStorage';
import {
  CURRENCIES,
  CurrencyDef,
  DEFAULT_CURRENCY_CODE,
  findCurrency,
} from '../constants/currencies';
import { pkr as pkrRaw, pkrF as pkrFRaw } from '../utils/currency';

interface CurrencyCtx {
  currency: CurrencyDef;
  currencyCode: string;
  setCurrency: (code: string) => void;
  pkr: (n: number) => string;
  pkrF: (n: number) => string;
}

const DEFAULT: CurrencyDef = findCurrency(DEFAULT_CURRENCY_CODE);

const CurrencyContext = createContext<CurrencyCtx>({
  currency: DEFAULT,
  currencyCode: DEFAULT.code,
  setCurrency: () => {},
  pkr: (n: number) => pkrRaw(n, DEFAULT),
  pkrF: (n: number) => pkrFRaw(n, DEFAULT),
});

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [code, setCode] = useStorage<string>('hm_currency', DEFAULT_CURRENCY_CODE);
  const currency = useMemo(() => findCurrency(code), [code]);

  const pkr = useCallback((n: number) => pkrRaw(n, currency), [currency]);
  const pkrF = useCallback((n: number) => pkrFRaw(n, currency), [currency]);

  const setCurrency = useCallback((c: string) => {
    // Guard against unknown codes to keep storage clean.
    const known = CURRENCIES.some(x => x.code === c);
    if (known) setCode(c);
  }, [setCode]);

  const value = useMemo<CurrencyCtx>(
    () => ({ currency, currencyCode: currency.code, setCurrency, pkr, pkrF }),
    [currency, setCurrency, pkr, pkrF],
  );

  return (
    <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
