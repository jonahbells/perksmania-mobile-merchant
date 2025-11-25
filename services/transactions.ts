import { getToken } from '@/services/auth';
import type { Perk } from '@/types/perks';
import type { Customer } from '@/types/user';
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
export interface TransactionResponse {
  rows: Transaction[];
  total: number;
}

// Transaction interface matching the actual API response
export interface Transaction {
  _id: string;
  customer: Customer;
  perks: Perk;
  creation_date: string;
  status: 'For Approval' | 'Approved' | 'Cancelled';
  update_date?: string;
  // Additional fields that might be present
  notes?: string;
  redeemed_date?: string;
}

// Status mapping between API and app
type APIStatus = 'For Approval' | 'Approved' | 'Cancelled';
type AppStatus = 'pending' | 'completed' | 'cancelled';

// Helper function to map API status to app status
function mapAPIStatusToApp(apiStatus: APIStatus): AppStatus {
  switch (apiStatus) {
    case 'For Approval':
      return 'pending';
    case 'Approved':
      return 'completed';
    case 'Cancelled':
      return 'cancelled';
    default:
      return 'pending';
  }
}

// Helper function to map app status to API status
function mapAppStatusToAPI(appStatus: AppStatus): APIStatus {
  switch (appStatus) {
    case 'pending':
      return 'For Approval';
    case 'completed':
      return 'Approved';
    case 'cancelled':
      return 'Cancelled';
    default:
      return 'For Approval';
  }
}

// Local Order interface for the app
export interface Order {
  id: string;
  perkId: string;
  perkTitle: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  redemptionCode: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  status: AppStatus; // Using normalized app status values
  redeemedAt?: string;
  createdAt: string;
  merchantId: string;
  notes?: string;
}

// Adapter function to convert API Transaction to app Order
function adaptTransactionToOrder(transaction: Transaction): Order {
  // Safely access nested properties with fallbacks
  const perks = transaction.perks || {};
  const customer = transaction.customer || {};
  const merchantId = perks.merchant_id?._id || 'unknown';
  
  // Calculate discount amount and final amount from perks data with safe access
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
    id: transaction._id,
    perkId: perks._id || 'unknown',
    perkTitle: perks.perks_name || 'Unknown Perk',
    customerName: `${customer.firstname || ''} ${customer.lastname || ''}`.trim() || 'Unknown Customer',
    customerEmail: customer.email || 'unknown@example.com',
    customerPhone: customer.contact || undefined,
    redemptionCode: transaction._id, // Using transaction ID as redemption code
    discountType: discountType,
    discountValue: discountValue,
    originalAmount: originalAmount,
    discountAmount: discountAmount,
    finalAmount: finalAmount,
    status: mapAPIStatusToApp(transaction.status), // Map API status to app status
    redeemedAt: transaction.update_date,
    createdAt: transaction.creation_date,
    merchantId: merchantId,
    notes: transaction.notes,
  };
}

// Get all transactions for a merchant
export const getMerchantTransactions = async (
  merchantId: string,
  startDate?: string,
  endDate?: string
): Promise<Order[]> => {
  try {
    const params: any = {};
    
    // Add date range parameters if provided
    if (startDate) {
      params.startDate = startDate;
    }
    if (endDate) {
      params.endDate = endDate;
    }
    
    const response = await api.get(`/customer-transactions/merchant/${merchantId}`, {
      params
    });
    const transactionResponse: TransactionResponse = response.data;
    
    // Convert API transactions to app orders
    return transactionResponse.rows.map(adaptTransactionToOrder);
  } catch (error: any) {
    const errorResponse = createErrorResponse(error, {
      service: 'transactions',
      action: 'getMerchantTransactions',
      merchantId,
      startDate,
      endDate,
    });
    throw errorResponse;
  }
};

// Get pending transactions for a merchant
export const getPendingTransactions = async (merchantId: string): Promise<Order[]> => {
  try {
    const response = await api.get(`/customer-transactions/merchant/${merchantId}/pending`);
    const transactionResponse: TransactionResponse = response.data;
    
    return transactionResponse.rows.map(adaptTransactionToOrder);
  } catch (error: any) {
    const errorResponse = createErrorResponse(error, {
      service: 'transactions',
      action: 'getPendingTransactions',
      merchantId,
    });
    throw errorResponse;
  }
};

// Update transaction status
export const updateTransactionStatus = async (
  transactionId: string,
  status: 'pending' | 'completed' | 'cancelled',
  notes?: string
): Promise<any> => {
  try {
    // Map app status to API status
    const apiStatus = mapAppStatusToAPI(status);
    
    const response = await api.put(`/customer-transactions/${transactionId}`, {
      status: apiStatus,
      notes,
      // redeemed_date: status === 'completed' ? new Date().toISOString() : undefined,
    });
    
    const updatedTransaction = response.data;
    return adaptTransactionToOrder(updatedTransaction);
  } catch (error: any) {
    const errorResponse = createErrorResponse(error, {
      service: 'transactions',
      action: 'updateTransactionStatus',
      transactionId,
      status,
    });
    throw errorResponse;
  }
};

// Verify redemption code
export const verifyRedemptionCode = async (
  redemptionCode: string
): Promise<Order | null> => {
  
  try {
    // Clean the code by removing any surrounding quotes
    let cleanCode = redemptionCode.trim();
    if (cleanCode.startsWith('"') && cleanCode.endsWith('"')) {
      cleanCode = cleanCode.slice(1, -1);
    }
    
    const response = await api.post(
      `/qrencoder/decode`,
      {
        code: cleanCode,
      },
    );
    
    const transaction = response.data;
    
    if (transaction.result === true) {
      return transaction;
    }
    
    if (transaction.result === false) {
      throw new Error(transaction.description || 'Invalid QR Code');
    }
    
    return null;
  } catch (error: any) {
    console.log('Verify redemption error:', error);
    
    if (error.response?.status === 404) {
      return null;
    }
    
    const errorResponse = createErrorResponse(error, {
      service: 'transactions',
      action: 'verifyRedemptionCode',
      redemptionCode,
    });
    throw errorResponse;
  }
};

// Get transaction analytics for a merchant
export const getTransactionAnalytics = async (merchantId: string) => {
  try {
    const response = await api.get(`/customer-transactions/merchant/${merchantId}/analytics`);
    return response.data;
  } catch (error: any) {
    const errorResponse = createErrorResponse(error, {
      service: 'transactions',
      action: 'getTransactionAnalytics',
      merchantId,
    });
    throw errorResponse;
  }
};

// Get transactions by date range
export const getTransactionsByDateRange = async (
  merchantId: string,
  startDate: string,
  endDate: string
): Promise<Order[]> => {
  try {
    // Use the updated getMerchantTransactions function with date parameters
    return await getMerchantTransactions(merchantId, startDate, endDate);
  } catch (error: any) {
    const errorResponse = createErrorResponse(error, {
      service: 'transactions',
      action: 'getTransactionsByDateRange',
      merchantId,
      startDate,
      endDate,
    });
    throw errorResponse;
  }
};
