import { useNetworkStore } from '@/store/networkStore';
import { Merchant } from '@/types/user';
import { analyzeError, createErrorResponse } from '@/utils/errorHandler';
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios, { AxiosInstance, AxiosResponse } from 'axios';
// @ts-ignore
import CryptoJS from "react-native-crypto-js";

// Define the base URL from environment variables
const apiUrl: string | undefined = process.env.EXPO_PUBLIC_API_URL;

// Create an instance of axios with base configuration
const api: AxiosInstance = axios.create({
  baseURL: apiUrl,  // Your base URL
  timeout: 10000,  // Optional timeout
  headers: {
    'Content-Type': 'application/json',
    // Add any default headers you want
  },
});

interface Token {
  accessToken: string;
  refreshToken?: string;
  is_activated?: boolean;
}

interface SignUpResponse extends AxiosResponse {
  data: any; // Define the expected response shape for signup if known
}

interface SignInResponse extends AxiosResponse {
  data: Token;
}

// Enhanced response interceptor with error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log('[API Interceptor] Original error:', {
      message: error.message,
      code: error.code,
      url: error.config?.url,
      method: error.config?.method,
      hasResponse: !!error.response,
      hasRequest: !!error.request,
    });
    
    // Analyze the error using our error handler
    const enhancedError = analyzeError(error, {
      url: error.config?.url,
      method: error.config?.method,
      timestamp: new Date().toISOString(),
    });

    console.log('[API Interceptor] Enhanced error:', {
      type: enhancedError.type,
      severity: enhancedError.severity,
      canRetry: enhancedError.canRetry,
      userMessage: enhancedError.userMessage,
    });

    // Add to failed requests queue if it's a network error and we're offline
    if (enhancedError.type === 'NETWORK_ERROR' && enhancedError.canRetry) {
      const networkStore = useNetworkStore.getState();
      console.log('[API Interceptor] Adding to retry queue:', error.config?.url);
      
      // Create retry function
      const retryRequest = () => api.request(error.config);
      const requestId = `${error.config?.method}_${error.config?.url}_${Date.now()}`;
      
      networkStore.addToRetryQueue(requestId, retryRequest);
    }

    // Log enhanced error information
    console.error(`[API Error] ${enhancedError.type}:`, {
      message: enhancedError.message,
      url: error.config?.url,
      method: error.config?.method,
      statusCode: enhancedError.statusCode,
      canRetry: enhancedError.canRetry,
    });
    
    return Promise.reject(enhancedError);
  }
);

// Function to save token in AsyncStorage
const setToken = async (token: Token): Promise<void> => {
  try {
    await AsyncStorage.setItem("token", JSON.stringify(token));
  } catch (error) {
    console.log("Error saving token to AsyncStorage:", error);
  }
};

// Function to get token from AsyncStorage
export const getToken = async (): Promise<Token | null> => {
  try {
    const token = await AsyncStorage.getItem("token");
    console.log(token);
    return token ? JSON.parse(token) : null;
  } catch (error) {
    console.log("Error getting token from AsyncStorage:", error);
    return null;
  }
};

// Function to clear tokens
export const signOut = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove(["token", "loginUser"]);
  } catch (error) {
    console.log("Error during sign-out:", error);
  }
};

// Sign In Function using AES Encryption
export const signIn = async (email: string, password: string): Promise<SignInResponse> => {
  const passphraseEmail = "L#G@LR#GYSTRY";
  const passphrasePass = "L#G@LR#GYSTRY!!!";
  const encryptEmail = CryptoJS.AES.encrypt(email, passphraseEmail).toString();
  const encryptPass = CryptoJS.AES.encrypt(password, passphrasePass).toString();

  try {
    const response = await api.post("/merchants/login", {
      client: encryptEmail,
      secret: encryptPass,
    });

    const token: Token = response.data;

    if (token.accessToken) {
      await setToken(token);
    }
    else {
      throw new Error("Sign in failed, Please check your email and password.");
    }
    return response;
  } catch (error: any) {
    const errorResponse = createErrorResponse(error, {
      service: 'auth',
      action: 'signIn',
      email, // Don't log password for security
    });
    throw errorResponse;
  }
};

// Sign Up Function using AES Encryption
export const signUp = async (form: Record<string, any>): Promise<SignUpResponse> => {
  console.log("Form before encryption:", form);

  const passphrase = "L#G@LR#GYSTRY";
  const formString = JSON.stringify(form);
  const encryptForm = CryptoJS.AES.encrypt(formString, passphrase).toString();

  console.log("Encrypted form:", encryptForm);

  try {
    const response = await api.post("/customers", {
      aparam: encryptForm,
    });

    return response.data;
  } catch (error: any) {
    console.log("Error during sign-up:", error.response?.data || error?.messag || 'Sign up failed');
    throw error;
  }
};

// Fetch the current user's profile after login
export const getCurrentUser = async (): Promise<Merchant> => {
  try {
    const token = await getToken();

    if (!token || !token.accessToken) {
      throw new Error("No access token found. Please log in.");
    }

    const response = await api.get("/merchants/getuser", {
      headers: {
        Authorization: `Bearer ${token.accessToken}`,
      },
    });

    const account: Merchant = response.data;

    if (!account.is_activated) {
      await AsyncStorage.multiRemove(["token", "loginUser"]);
      throw new Error('Account not activated, Please check your email for the activation link.');
    }
    // await AsyncStorage.setItem("loginUser", JSON.stringify(account));
    return account;
  } catch (error: any) {
    console.log(error.response?.data || error.message);
    throw error;
  }
};

// Google Sign-In Function
export const signWithGoogle = async (params: { email: any; firstName: any; lastName: any; }) => {
  try {
    const response = await api.post("/social", {
      email: params.email,
      firstName: params.firstName,
      lastName: params.lastName,
    });

    const token: Token = response.data.token;
    console.log("Token received:", token);

    if (token.accessToken) {
      await setToken(token);
    }
    return response;
  } catch (error: any) {
    console.log("Error during Google sign-in:", error.response?.data || error.message);
    throw error;
  }
};

// Apple Sign-In Function
export const signWithApple = async (params: { email?: string | null; firstName?: string | null; lastName?: string | null; identityToken: string; }) => {
  try {
    const response = await api.post("/social/apple", {
      email: params.email,
      firstName: params.firstName,
      lastName: params.lastName,
      identityToken: params.identityToken,
    });

    const token: Token = response.data.token;
    console.log("Apple token received:", token);

    if (token.accessToken) {
      await setToken(token);
    }
    return response;
  } catch (error: any) {
    console.log("Error during Apple sign-in:", error.response?.data || error.message);
    throw error;
  }
};

// Reset Password Function using AES Encryption
export const requestResetPassword = async (email: string): Promise<SignUpResponse> => {
  console.log('email:', email);

  const passphrase = "L#G@LR#GYSTRY";
  const encryptEmail = CryptoJS.AES.encrypt(email, passphrase).toString();

  console.log("Encrypted form:", encryptEmail);

  try {
    const response = await api.post("/merchants/forgotpassword", {
      email: email,
    });

    console.log("Server response:", response);
    return response.data;
  } catch (error: any) {
    console.log("Error during sign-up:", error.response?.data || error?.messag || 'No account found with this email address');
    throw error;
  }
};

export const verifyOtp = async (email: string, otp: string): Promise<SignUpResponse> => {
  console.log("Form before encryption:", email, otp);

  // const passphrase = "L#G@LR#GYSTRY";
  // const encryptEmail = CryptoJS.AES.encrypt(email, passphrase).toString();

  // console.log("Encrypted form:", encryptEmail);

  try {
    const response = await api.post("/merchants/verify-otp", {
      email: email,
      otp: otp
    });

    console.log("Server response:", response.data);

    return response.data;
  } catch (error: any) {
    console.log("Error during sign-up:", error.response?.data || error?.messag || 'Failed to verify code');
    throw error;
  }
};

export const resetPassword = async (id: string, password: string): Promise<SignUpResponse> => {
  console.log("Form before encryption:", id);

  const passphrase = "L#G@LR#GYSTRY";
  const encryptEmail = CryptoJS.AES.encrypt(password, passphrase).toString();

  // console.log("Encrypted form:", encryptEmail);

  try {
    const response = await api.post("/merchants/mobile/" + id + "/password-reset", {
      newpassword: encryptEmail,
    });

    console.log("Server response:", response.data);

    return response.data;
  } catch (error: any) {
    const errorResponse = createErrorResponse(error, {
      service: 'auth',
      action: 'resetPassword',
      userId: id,
    });
    throw errorResponse;
  }
};

// Delete Account Function
export const deleteAccount = async (id: string): Promise<{ success: boolean; message: string }> => {
  try {
    const token = await getToken();

    if (!token || !token.accessToken) {
      throw new Error("No access token found. Please log in.");
    }

    const response = await api.delete(`/merchants/${id}`, {
      headers: {
        Authorization: `Bearer ${token.accessToken}`,
      },
    });

    console.log("Delete account response:", response.data);

    return {
      success: true,
      message: response.data.message || "Account deleted successfully"
    };
  } catch (error: any) {
    console.log("Error during account deletion:", error.response?.data || error.message);
    throw new Error(
      error.response?.data?.message || 
      error.response?.data || 
      error.message || 
      'Failed to delete account'
    );
  }
};
