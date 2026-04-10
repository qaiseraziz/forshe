import { useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';

/**
 * A hook similar to useStorage but backed by expo-secure-store.
 * Suitable for sensitive data like PINs.
 *
 * Note: SecureStore only supports string values, so this hook
 * works with strings directly (no JSON serialization).
 *
 * @param key   The SecureStore key
 * @param defaultValue  Fallback value while loading or if no value is stored
 * @returns [value, setValue, loaded]
 */
export function useSecureStorage(
  key: string,
  defaultValue: string,
): [string, (v: string) => void, boolean] {
  const [value, setValue] = useState<string>(defaultValue);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    SecureStore.getItemAsync(key).then(stored => {
      if (!cancelled) {
        if (stored !== null) {
          setValue(stored);
        }
        setLoaded(true);
      }
    }).catch(() => {
      if (!cancelled) setLoaded(true);
    });
    return () => { cancelled = true; };
  }, [key]);

  const set = useCallback((v: string) => {
    setValue(v);
    if (v === '') {
      SecureStore.deleteItemAsync(key).catch(() => {});
    } else {
      SecureStore.setItemAsync(key, v).catch(() => {});
    }
  }, [key]);

  return [value, set, loaded];
}
