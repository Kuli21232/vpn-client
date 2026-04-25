import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { useColorScheme, Animated, Easing } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeMode, ThemeColors, darkColors, lightColors } from '../theme/colors';

interface ThemeContextType {
  mode: ThemeMode;
  colors: ThemeColors;
  isDark: boolean;
  fadeAnim: Animated.Value;
  setMode: (mode: ThemeMode) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'dark',
  colors: darkColors,
  isDark: true,
  fadeAnim: new Animated.Value(1),
  setMode: async () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('dark');
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    AsyncStorage.getItem('theme_mode').then((saved) => {
      if (saved === 'dark' || saved === 'light' || saved === 'system') {
        setModeState(saved);
      }
    });
  }, []);

  const setMode = async (newMode: ThemeMode) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 120, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, easing: Easing.in(Easing.ease), useNativeDriver: true }),
    ]).start();

    setTimeout(() => setModeState(newMode), 120);
    await AsyncStorage.setItem('theme_mode', newMode);
  };

  const isDark = mode === 'dark' ? true : mode === 'light' ? false : systemScheme === 'dark';
  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ mode, colors, isDark, fadeAnim, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
