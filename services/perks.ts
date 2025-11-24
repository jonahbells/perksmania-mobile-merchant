import { getToken } from '@/services/auth';
import type { Perk } from '@/types/perks';
import { analyzeError, createErrorResponse } from '@/utils/errorHandler';
import axios, { AxiosInstance } from 'axios';

// Define the base URL from environment variables
const apiUrl: string | undefined = process.env.EXPO_PUBLIC_API_URL;

// Create an instance of axios with base configuration
const api: AxiosInstance = axios.create({
  baseURL: apiUrl,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await getToken();
      if (token?.accessToken) {
        config.headers.Authorization = `Bearer ${token.accessToken}`;
      }
    } catch (error) {
      console.log('Error getting token for request:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Enhanced response interceptor with error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log('[Transactions API Error]:', {
      message: error.message,
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
    });
    
    const enhancedError = analyzeError(error, {
      url: error.config?.url,
      method: error.config?.method,
      timestamp: new Date().toISOString(),
    });
    
    return Promise.reject(enhancedError);
  }
);

/**
 * API Endpoints Used:
 * - GET /customer-transactions/merchant/{merchantId} - Get all transactions for merchant
 * - GET /customer-transactions/merchant/{merchantId}/pending - Get pending transactions
 * - PUT /customer-transactions/{transactionId}/status - Update transaction status
 * - POST /customer-transactions/verify - Verify redemption code
 * - GET /customer-transactions/merchant/{merchantId}/analytics - Get analytics
 */

// API Response wrapper interface
export interface PerksResponse {
  rows: Perk[];
  total: number;
}

// Local Order interface for the app
export interface PerkInterface {
    id: string;
    title: string;
    description: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    totalLimit?: number;
    currentRedemptions?: number;
    expiryDate: string;
    isActive: boolean;
    termsConditions?: string;
    createdAt: string;
    updatedAt: string;
    merchantId: string;
  }

// Adapter function to convert API Transaction to app Order
function adaptPerksResponse(perks: Perk): PerkInterface {
  // Calculate discount amount and final amount from perks data
  const originalAmount = parseFloat(perks.original_amount || '0');
  const discountAmountFromAPI = parseFloat(perks.discount || '0');
  
  // The API returns the actual discount amount, not the percentage
  // So we need to calculate the percentage if needed
  const discountPercentage = originalAmount > 0 ? (discountAmountFromAPI / originalAmount) * 100 : 0;
  
  // Determine if this looks like a percentage-based discount
  // If the percentage is a round number (like 50%), it's likely percentage-based
  const isLikelyPercentage = Math.abs(discountPercentage - Math.round(discountPercentage)) < 0.01;
  const discountType = isLikelyPercentage ? 'percentage' : 'fixed';
  
  const discountValue = discountType === 'percentage' ? Math.round(discountPercentage) : discountAmountFromAPI;
  const discountAmount = discountAmountFromAPI; // API already provides the discount amount
  const finalAmount = originalAmount - discountAmount;

  return {
    id: perks._id,
    title: perks.perks_name,
    description: perks.perks_description,
    discountType: 'fixed',
    discountValue: discountAmount,
    totalLimit: perks.limit,
    currentRedemptions: perks.limit,
    expiryDate: perks.end_date,
    isActive: perks.publish,
    createdAt: perks.start_date,
    updatedAt: perks.update_date,
    merchantId: perks.merchant_id._id,
  };
}

// Get all transactions for a merchant
export const getAllPerks = async (merchantId: string): Promise<PerkInterface[]> => {
  try {
    const response = await api.get(`/perks/bymerchant/all/${merchantId}`);
    const perksResponse: PerksResponse = response.data;
    
    // Convert API transactions to app orders
    return perksResponse.rows.map(adaptPerksResponse);
  } catch (error: any) {
    const errorResponse = createErrorResponse(error, {
      service: 'perks',
      action: 'getByMerchantAll',
      merchantId,
    });
    throw errorResponse;
  }
};

// Update transaction status
export const updatePerksStatus = async (
  merchantId: string,
  transactionId: string,
  status: 'pending' | 'completed' | 'cancelled',
  notes?: string
): Promise<Order> => {
  try {
    // Map app status to API status
    const apiStatus = mapAppStatusToAPI(status);
    
    const response = await api.put(`/customer-transactions/${transactionId}/status`, {
      status: apiStatus,
      notes,
      redeemed_date: status === 'completed' ? new Date().toISOString() : undefined,
    });
    
    const updatedTransaction: Transaction = response.data;
    return adaptTransactionToOrder(updatedTransaction);
  } catch (error: any) {
    const errorResponse = createErrorResponse(error, {
      service: 'transactions',
      action: 'updateTransactionStatus',
      merchantId,
      transactionId,
      status,
    });
    throw errorResponse;
  }
};





