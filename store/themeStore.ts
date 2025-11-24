import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, lightColors } from '@/constants/colors';

export type ThemeType = 'dark' | 'light';

interface ThemeState {
  theme: ThemeType;
  colors: typeof colors | typeof lightColors;
  toggleTheme: () => void;
  setTheme: (theme: ThemeType) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'light', // Default to light theme
      colors: lightColors, // Use light colors by default
      
      toggleTheme: () => {
        set((state) => {
          const newTheme = state.theme === 'dark' ? 'light' : 'dark';
          return { 
            theme: newTheme,
            colors: newTheme === 'dark' ? colors : lightColors
          };
        });
      },
      
      setTheme: (theme) => {
        set({ 
          theme,
          colors: theme === 'dark' ? colors : lightColors
        });
      },
    }),
    {
      name: 'merchant-theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
