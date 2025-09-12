import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Perk {
  id: string;
  title: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  totalLimit: number;
  currentRedemptions: number;
  expiryDate: string;
  isActive: boolean;
  termsConditions?: string;
  createdAt: string;
  updatedAt: string;
  merchantId: string;
}

export interface Order {
  id: string;
  perkId: string;
  perkTitle: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  redemptionCode: string;
  status: 'pending' | 'completed' | 'cancelled';
  redeemedAt?: string;
  createdAt: string;
  merchantId: string;
}

export interface Analytics {
  totalPerks: number;
  activePerks: number;
  totalRedemptions: number;
  todayRedemptions: number;
  totalRevenue: number;
  todayRevenue: number;
  topPerformingPerks: {
    perkId: string;
    title: string;
    redemptions: number;
    revenue: number;
  }[];
  recentActivity: {
    id: string;
    action: string;
    timestamp: string;
    perkTitle?: string;
    customerName?: string;
  }[];
}

interface PerksState {
  perks: Perk[];
  orders: Order[];
  analytics: Analytics | null;
  isLoading: boolean;
  error: string | null;

  // Perk actions
  createPerk: (perkData: Omit<Perk, 'id' | 'createdAt' | 'updatedAt' | 'currentRedemptions' | 'merchantId'>) => Promise<void>;
  updatePerk: (id: string, updates: Partial<Perk>) => Promise<void>;
  deletePerk: (id: string) => Promise<void>;
  togglePerkStatus: (id: string) => Promise<void>;
  fetchPerks: () => Promise<void>;

  // Order actions
  fetchOrders: () => Promise<void>;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
  verifyRedemption: (redemptionCode: string) => Promise<Order | null>;

  // Analytics actions
  fetchAnalytics: () => Promise<void>;

  // Utility actions
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

// Mock data for development
const mockPerks: Perk[] = [
  {
    id: '1',
    title: '20% Off Coffee',
    description: 'Get 20% discount on all coffee beverages',
    discountType: 'percentage',
    discountValue: 20,
    totalLimit: 100,
    currentRedemptions: 45,
    expiryDate: '2024-12-31',
    isActive: true,
    termsConditions: 'Valid for dine-in only. Cannot be combined with other offers.',
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-03-01T10:30:00Z',
    merchantId: '1',
  },
  {
    id: '2',
    title: 'Buy 1 Get 1 Free Burger',
    description: 'Free burger when you buy one',
    discountType: 'percentage',
    discountValue: 50,
    totalLimit: 50,
    currentRedemptions: 23,
    expiryDate: '2024-11-30',
    isActive: true,
    createdAt: '2024-02-01T09:00:00Z',
    updatedAt: '2024-02-15T14:20:00Z',
    merchantId: '1',
  },
  {
    id: '3',
    title: 'Free Dessert',
    description: 'Complimentary dessert with any main course',
    discountType: 'fixed',
    discountValue: 150,
    totalLimit: 30,
    currentRedemptions: 12,
    expiryDate: '2024-10-15',
    isActive: false,
    createdAt: '2024-01-01T07:00:00Z',
    updatedAt: '2024-02-20T16:45:00Z',
    merchantId: '1',
  },
];

const mockOrders: Order[] = [
  {
    id: 'ORD-001',
    perkId: '1',
    perkTitle: '20% Off Coffee',
    customerName: 'John Doe',
    customerEmail: 'john@example.com',
    customerPhone: '+63 912 345 6789',
    redemptionCode: 'QR123ABC456',
    status: 'completed',
    redeemedAt: '2024-03-15T09:15:00Z',
    createdAt: '2024-03-15T09:10:00Z',
    merchantId: '1',
  },
  {
    id: 'ORD-002',
    perkId: '2',
    perkTitle: 'Buy 1 Get 1 Free Burger',
    customerName: 'Jane Smith',
    customerEmail: 'jane@example.com',
    redemptionCode: 'QR789XYZ012',
    status: 'pending',
    createdAt: '2024-03-15T10:02:00Z',
    merchantId: '1',
  },
  {
    id: 'ORD-003',
    perkId: '1',
    perkTitle: '20% Off Coffee',
    customerName: 'Carlos Reyes',
    customerEmail: 'carlos@example.com',
    redemptionCode: 'QR345DEF678',
    status: 'completed',
    redeemedAt: '2024-03-15T11:45:00Z',
    createdAt: '2024-03-15T11:40:00Z',
    merchantId: '1',
  },
];

export const usePerksStore = create<PerksState>()(
  persist(
    (set, get) => ({
      perks: [],
      orders: [],
      analytics: null,
      isLoading: false,
      error: null,

      createPerk: async (perkData) => {
        set({ isLoading: true, error: null });
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 800));
          
          const newPerk: Perk = {
            ...perkData,
            id: Date.now().toString(),
            currentRedemptions: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            merchantId: '1', // Get from auth store
          };
          
          set((state) => ({
            perks: [...state.perks, newPerk],
            isLoading: false,
          }));
        } catch (error) {
          set({ isLoading: false, error: 'Failed to create perk' });
        }
      },

      updatePerk: async (id, updates) => {
        set({ isLoading: true, error: null });
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 600));
          
          set((state) => ({
            perks: state.perks.map(perk => 
              perk.id === id 
                ? { ...perk, ...updates, updatedAt: new Date().toISOString() }
                : perk
            ),
            isLoading: false,
          }));
        } catch (error) {
          set({ isLoading: false, error: 'Failed to update perk' });
        }
      },

      deletePerk: async (id) => {
        set({ isLoading: true, error: null });
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 500));
          
          set((state) => ({
            perks: state.perks.filter(perk => perk.id !== id),
            isLoading: false,
          }));
        } catch (error) {
          set({ isLoading: false, error: 'Failed to delete perk' });
        }
      },

      togglePerkStatus: async (id) => {
        const { updatePerk } = get();
        const perk = get().perks.find(p => p.id === id);
        if (perk) {
          await updatePerk(id, { isActive: !perk.isActive });
        }
      },

      fetchPerks: async () => {
        set({ isLoading: true, error: null });
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          set({
            perks: mockPerks,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false, error: 'Failed to fetch perks' });
        }
      },

      fetchOrders: async () => {
        set({ isLoading: true, error: null });
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 800));
          
          set({
            orders: mockOrders,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false, error: 'Failed to fetch orders' });
        }
      },

      updateOrderStatus: async (orderId, status) => {
        set({ isLoading: true, error: null });
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 500));
          
          set((state) => ({
            orders: state.orders.map(order => 
              order.id === orderId 
                ? { ...order, status, redeemedAt: status === 'completed' ? new Date().toISOString() : undefined }
                : order
            ),
            isLoading: false,
          }));
        } catch (error) {
          set({ isLoading: false, error: 'Failed to update order status' });
        }
      },

      verifyRedemption: async (redemptionCode) => {
        set({ isLoading: true, error: null });
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const order = get().orders.find(o => o.redemptionCode === redemptionCode && o.status === 'pending');
          
          if (order) {
            // Update order status to completed
            await get().updateOrderStatus(order.id, 'completed');
            return order;
          }
          
          set({ isLoading: false, error: 'Invalid or already used redemption code' });
          return null;
        } catch (error) {
          set({ isLoading: false, error: 'Failed to verify redemption code' });
          return null;
        }
      },

      fetchAnalytics: async () => {
        set({ isLoading: true, error: null });
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1200));
          
          const { perks, orders } = get();
          const completedOrders = orders.filter(o => o.status === 'completed');
          
          const analytics: Analytics = {
            totalPerks: perks.length,
            activePerks: perks.filter(p => p.isActive).length,
            totalRedemptions: completedOrders.length,
            todayRedemptions: 12, // Mock data
            totalRevenue: completedOrders.length * 200, // Mock calculation
            todayRevenue: 2400, // Mock data
            topPerformingPerks: [
              { perkId: '1', title: '20% Off Coffee', redemptions: 45, revenue: 9000 },
              { perkId: '2', title: 'BOGO Burger', redemptions: 23, revenue: 4600 },
              { perkId: '3', title: 'Free Dessert', redemptions: 12, revenue: 1800 },
            ],
            recentActivity: [
              { id: '1', action: 'New customer redeemed "20% Off Coffee"', timestamp: '2 minutes ago' },
              { id: '2', action: 'Perk "Free Dessert" was updated', timestamp: '1 hour ago' },
              { id: '3', action: '5 customers redeemed perks', timestamp: '3 hours ago' },
              { id: '4', action: 'New perk "Happy Hour" was created', timestamp: '1 day ago' },
            ],
          };
          
          set({ analytics, isLoading: false });
        } catch (error) {
          set({ isLoading: false, error: 'Failed to fetch analytics' });
        }
      },

      clearError: () => set({ error: null }),
      setLoading: (loading: boolean) => set({ isLoading: loading }),
    }),
    {
      name: 'merchant-perks-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        perks: state.perks,
        orders: state.orders,
      }),
    }
  )
);

