import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import React from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  connectionType: string | null;
  isInitialized: boolean;
  lastConnectedAt: Date | null;
  
  // Connection quality indicators
  isSlowConnection: boolean;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'offline';
  
  retryQueue: Array<{
    id: string;
    request: () => Promise<any>;
    timestamp: Date;
    retryCount: number;
  }>;
  
  // Actions
  setConnectionStatus: (
    isConnected: boolean, 
    isInternetReachable: boolean | null, 
    connectionType: string | null
  ) => void;
  setConnectionQuality: (quality: 'excellent' | 'good' | 'poor' | 'offline') => void;
  addToRetryQueue: (id: string, request: () => Promise<any>) => void;
  removeFromRetryQueue: (id: string) => void;
  clearRetryQueue: () => void;
  processRetryQueue: () => Promise<void>;
  initialize: () => void;
  
  // Derived getters
  canMakeRequests: () => boolean;
  getRetryableRequests: () => NetworkState['retryQueue'];
}

export const useNetworkStore = create<NetworkState>()(
  persist(
    (set, get) => ({
      isConnected: true, // Optimistic default
      isInternetReachable: null,
      connectionType: null,
      isInitialized: false,
      lastConnectedAt: null,
      isSlowConnection: false,
      connectionQuality: 'excellent',
      retryQueue: [],

      setConnectionStatus: (isConnected, isInternetReachable, connectionType) => {
        const now = new Date();
        const currentState = get();
        const newQuality = determineConnectionQuality(isConnected, isInternetReachable, connectionType);
        const isSlowConnection = newQuality === 'poor';
        
        set({
          isConnected,
          isInternetReachable,
          connectionType,
          lastConnectedAt: isConnected ? now : currentState.lastConnectedAt,
          isSlowConnection,
          connectionQuality: newQuality,
        });

        // Process retry queue when connection is restored
        if (isConnected && !currentState.isConnected) {
          setTimeout(() => {
            get().processRetryQueue();
          }, 1000); // Small delay to ensure stable connection
        }
      },
      
      setConnectionQuality: (quality) => {
        set(state => ({
          ...state,
          connectionQuality: quality,
          isSlowConnection: quality === 'poor',
        }));
      },

      addToRetryQueue: (id, request) => {
        const { retryQueue } = get();
        
        // Remove existing entry if it exists
        const filteredQueue = retryQueue.filter(item => item.id !== id);
        
        // Add new entry
        const newItem = {
          id,
          request,
          timestamp: new Date(),
          retryCount: 0,
        };
        
        set({
          retryQueue: [...filteredQueue, newItem],
        });
      },

      removeFromRetryQueue: (id) => {
        const { retryQueue } = get();
        set({
          retryQueue: retryQueue.filter(item => item.id !== id),
        });
      },

      clearRetryQueue: () => {
        set({ retryQueue: [] });
      },

      processRetryQueue: async () => {
        const { retryQueue, isConnected, removeFromRetryQueue } = get();
        
        if (!isConnected || retryQueue.length === 0) return;
        
        console.log(`Processing ${retryQueue.length} queued requests...`);
        
        // Process items in parallel but with limited concurrency
        const processItem = async (item: typeof retryQueue[0]) => {
          try {
            await item.request();
            removeFromRetryQueue(item.id);
            console.log(`Successfully processed queued request: ${item.id}`);
          } catch (error) {
            console.error(`Failed to process queued request ${item.id}:`, error);
            
            // Update retry count
            const currentQueue = get().retryQueue;
            const updatedQueue = currentQueue.map(queueItem => 
              queueItem.id === item.id 
                ? { ...queueItem, retryCount: queueItem.retryCount + 1 }
                : queueItem
            );
            
            // Remove item if it has been retried too many times (max 3 retries)
            const finalQueue = updatedQueue.filter(queueItem => 
              queueItem.id !== item.id || queueItem.retryCount < 3
            );
            
            set({ retryQueue: finalQueue });
          }
        };
        
        // Process up to 3 items concurrently
        const chunks = [];
        for (let i = 0; i < retryQueue.length; i += 3) {
          chunks.push(retryQueue.slice(i, i + 3));
        }
        
        for (const chunk of chunks) {
          await Promise.allSettled(chunk.map(processItem));
        }
      },

      initialize: () => {
        if (get().isInitialized) {
          console.log('[NetworkStore] Already initialized');
          return;
        }
        
        console.log('[NetworkStore] Initializing network monitoring...');
        
        // Set up network listener
        const unsubscribe = NetInfo.addEventListener(state => {
          console.log('[NetworkStore] Network state changed:', {
            isConnected: state.isConnected,
            isInternetReachable: state.isInternetReachable,
            type: state.type,
            details: state.details,
          });
          
          get().setConnectionStatus(
            state.isConnected ?? false,
            state.isInternetReachable,
            state.type
          );
        });
        
        // Initial network check
        NetInfo.fetch().then(state => {
          console.log('[NetworkStore] Initial network state:', {
            isConnected: state.isConnected,
            isInternetReachable: state.isInternetReachable,
            type: state.type,
            details: state.details,
          });
          
          get().setConnectionStatus(
            state.isConnected ?? false,
            state.isInternetReachable,
            state.type
          );
        }).catch(error => {
          console.error('[NetworkStore] Error fetching initial network state:', error);
        });
        
        set({ isInitialized: true });
        console.log('[NetworkStore] Initialization complete');
        
        // Return cleanup function (though we won't typically call it)
        return unsubscribe;
      },
      
      // Derived getters
      canMakeRequests: () => {
        const state = get();
        return state.isConnected && state.isInternetReachable !== false;
      },
      
      getRetryableRequests: () => {
        const state = get();
        return state.retryQueue.filter(request => request.retryCount < 3);
      },
    }),
    {
      name: 'network-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Only persist certain fields, not the functions or retry queue
        lastConnectedAt: state.lastConnectedAt,
        isConnected: state.isConnected, // For optimistic loading on app start
      }),
    }
  )
);

/**
 * Determines connection quality based on network info
 */
function determineConnectionQuality(
  isConnected: boolean,
  isInternetReachable: boolean | null,
  connectionType: string | null
): 'excellent' | 'good' | 'poor' | 'offline' {
  if (!isConnected || isInternetReachable === false) {
    return 'offline';
  }
  
  if (!connectionType) {
    return 'good'; // Default when type is unknown but connected
  }
  
  const lowerType = connectionType.toLowerCase();
  
  // Excellent connections
  if (lowerType.includes('wifi') || lowerType.includes('ethernet')) {
    return 'excellent';
  }
  
  // Good connections
  if (lowerType.includes('5g') || lowerType.includes('lte') || lowerType.includes('4g')) {
    return 'good';
  }
  
  // Poor connections
  if (lowerType.includes('3g') || lowerType.includes('2g') || lowerType.includes('edge') || lowerType.includes('gprs')) {
    return 'poor';
  }
  
  // Default to good for unknown cellular types
  if (lowerType.includes('cellular') || lowerType.includes('mobile')) {
    return 'good';
  }
  
  return 'good'; // Default fallback
}

// Hook for easy network status checking
export const useNetworkStatus = () => {
  const isConnected = useNetworkStore(state => state.isConnected);
  const isInternetReachable = useNetworkStore(state => state.isInternetReachable);
  const connectionType = useNetworkStore(state => state.connectionType);
  const connectionQuality = useNetworkStore(state => state.connectionQuality);
  const isSlowConnection = useNetworkStore(state => state.isSlowConnection);
  const canMakeRequests = useNetworkStore(state => state.canMakeRequests());
  const initialize = useNetworkStore(state => state.initialize);
  
  // Initialize on first use
  React.useEffect(() => {
    initialize();
  }, [initialize]);
  
  return {
    isConnected,
    isInternetReachable,
    connectionType,
    connectionQuality,
    isSlowConnection,
    canMakeRequests,
    isOnline: canMakeRequests,
    isOffline: !canMakeRequests,
  };
};

/**
 * Hook to manage failed requests queue
 */
export function useFailedRequestsQueue() {
  const retryQueue = useNetworkStore(state => state.retryQueue);
  const addToRetryQueue = useNetworkStore(state => state.addToRetryQueue);
  const removeFromRetryQueue = useNetworkStore(state => state.removeFromRetryQueue);
  const clearRetryQueue = useNetworkStore(state => state.clearRetryQueue);
  const processRetryQueue = useNetworkStore(state => state.processRetryQueue);
  const getRetryableRequests = useNetworkStore(state => state.getRetryableRequests());
  
  return {
    retryQueue,
    retryableRequests: getRetryableRequests,
    addToRetryQueue,
    removeFromRetryQueue,
    clearRetryQueue,
    processRetryQueue,
    hasFailedRequests: retryQueue.length > 0,
    retryableCount: getRetryableRequests.length,
  };
}
