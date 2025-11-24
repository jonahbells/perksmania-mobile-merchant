
import { signOut as apiSignOut, getCurrentUser, signIn } from '@/services/auth';
import { Merchant } from '@/types/user';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// Local interface for the app's user state (normalized from API)
interface MerchantUser {
  id: string;
  businessName: string;
  email: string;
  phone: string;
  businessAddress: string;
  businessType?: string;
  logo?: string;
  verified: boolean;
  subscription: 'basic' | 'premium' | 'enterprise';
  createdAt: string;
  ownerName: string;
  city: string;
  province: string;
  region: string;
}

// Function to adapt API Merchant to local MerchantUser
function adaptMerchantToUser(merchant: Merchant): MerchantUser {
  return {
    id: merchant._id,
    businessName: merchant.business_name,
    email: merchant.email,
    phone: merchant.office_contact,
    businessAddress: merchant.office_address,
    businessType: merchant.business_category?.business || undefined,
    logo: merchant.logoimage || undefined,
    verified: merchant.is_activated && merchant.verification_status === 'verified',
    subscription: merchant.membership_plan as 'basic' | 'premium' | 'enterprise' || 'basic',
    createdAt: merchant.creation_date.$date,
    ownerName: merchant.owners_name,
    city: merchant.city,
    province: merchant.province,
    region: merchant.region,
  };
}

interface AuthState {
  user: MerchantUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (updates: Partial<MerchantUser>) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
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
          // Use real auth API
          const response = await signIn(email, password);
          if (response.data?.accessToken) {
            // Get the user profile after successful login
            const userProfile = await getCurrentUser();
            console.log("User profile:", userProfile);
            
            set({
              user: adaptMerchantToUser(userProfile),
              token: response.data.accessToken,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            
            router.replace('/(tabs)');
            return true;
          } else {
            throw new Error('Login failed - no access token received');
          }
        } catch (error: any) {
          console.error('Login error:', error);
          const errorMessage = error?.userMessage || error?.message || 'Invalid email or password. Please try again.';
          
          set({
            isLoading: false,
            error: errorMessage,
          });
          return false;
        }
      },


      logout: async () => {
        try {
          // Call API logout to clear server-side session
          await apiSignOut();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          // Always clear local state regardless of API call result
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            error: null,
          });
          router.replace('/(auth)/login');
        }
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
