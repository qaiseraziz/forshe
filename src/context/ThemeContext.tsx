import React, { createContext, useContext, useMemo } from 'react';
import { lightColors, darkColors, Colors } from '../constants/colors';
import { useStorage } from '../hooks/useStorage';

interface ThemeCtx {
  dark: boolean;
  setDark: (v: boolean | ((p: boolean) => boolean)) => void;
  colors: Colors;
}

const ThemeContext = createContext<ThemeCtx>({
  dark: false,
  setDark: () => {},
  colors: lightColors,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useStorage('hm_dark', false);
  const colors = useMemo(() => (dark ? darkColors : lightColors), [dark]);

  return (
    <ThemeContext.Provider value={{ dark, setDark, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
