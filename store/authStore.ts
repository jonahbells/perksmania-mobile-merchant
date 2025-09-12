
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

interface MerchantUser {
  id: string;
  businessName: string;
  email: string;
  phone: string;
  businessAddress: string;
  businessType: string;
  logo?: string;
  verified: boolean;
  subscription: 'basic' | 'premium' | 'enterprise';
  createdAt: string;
}

interface AuthState {
  user: MerchantUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => void;
  updateProfile: (updates: Partial<MerchantUser>) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

interface RegisterData {
  businessName: string;
  email: string;
  password: string;
  phone: string;
  businessAddress: string;
  businessType: string;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          // Simulate API call - replace with actual API
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Mock successful login
          const mockUser: MerchantUser = {
            id: '1',
            businessName: 'Test Restaurant',
            email,
            phone: '+1234567890',
            businessAddress: '123 Business St, City, State',
            businessType: 'restaurant',
            verified: true,
            subscription: 'premium',
            createdAt: new Date().toISOString(),
          };
          
          const mockToken = 'mock-jwt-token-123';
          
          set({
            user: mockUser,
            token: mockToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          
          router.replace('/(tabs)');
          return true;
        } catch (error) {
          set({
            isLoading: false,
            error: 'Invalid email or password',
          });
          return false;
        }
      },

      register: async (data: RegisterData) => {
        set({ isLoading: true, error: null });
        
        try {
          // Simulate API call - replace with actual API
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // Mock successful registration
          const newUser: MerchantUser = {
            id: Date.now().toString(),
            businessName: data.businessName,
            email: data.email,
            phone: data.phone,
            businessAddress: data.businessAddress,
            businessType: data.businessType,
            verified: false, // New accounts need verification
            subscription: 'basic',
            createdAt: new Date().toISOString(),
          };
          
          const mockToken = 'mock-jwt-token-new-user';
          
          set({
            user: newUser,
            token: mockToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          
          router.replace('/(tabs)');
          return true;
        } catch (error) {
          set({
            isLoading: false,
            error: 'Registration failed. Please try again.',
          });
          return false;
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
        router.replace('/(auth)/login');
      },

      updateProfile: (updates: Partial<MerchantUser>) => {
        const { user } = get();
        if (user) {
          set({
            user: { ...user, ...updates },
          });
        }
      },

      clearError: () => set({ error: null }),
      setLoading: (loading: boolean) => set({ isLoading: loading }),
    }),
    {
      name: 'merchant-auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
