import { doGET, doPUT } from "@/utils/HttpUtils";
import { API_ENDPOINTS } from "@/utils/constant";

export interface AdAccount {
  id: string; // "act_3115069758672562"
  account_id: string; // "3115069758672562"
  name: string;
  account_status: number; // 1 = active
  currency: string; // "INR", "USD"
  amount_spent: string;
  owner: string; // Business Manager ID
}

export interface AdAccountsResponse {
  success: boolean;
  data: {
    owned: AdAccount[];
    client: AdAccount[];
    total: number;
  };
  error?: string;
}

export interface AssignAdAccountPayload {
  fbAdAccountId: string; // e.g., "act_3115069758672562"
}

export interface AssignAdAccountResponse {
  success: boolean;
  message?: string;
  data?: {
    id: string;
    fbAdAccountId: string;
  };
  error?: string;
}

/**
 * Get Facebook ad accounts for a business
 * @param businessId - The Meta Business Manager ID (admin's fbAdAccountId)
 * @returns Ad accounts response with owned and client arrays
 */
export const getAdAccounts = async (
  businessId: string
): Promise<{ error: boolean; message?: string; data?: AdAccountsResponse["data"] }> => {
  if (!businessId) {
    return { error: true, message: "businessId is required" };
  }

  const response = await doGET(
    `${API_ENDPOINTS.FACEBOOK_AD_ACCOUNTS}?businessId=${encodeURIComponent(businessId)}`
  );

  if (!response.error && response.data?.success) {
    return { error: false, data: response.data.data };
  }

  return {
    error: true,
    message: response.data?.error || response.message || "Failed to fetch ad accounts",
  };
};

/**
 * Assign a Facebook ad account to a client user
 * @param clientId - The client user ID
 * @param fbAdAccountId - The ad account ID (with act_ prefix)
 * @returns Assignment response
 */
export const assignAdAccountToClient = async (
  clientId: string,
  fbAdAccountId: string
): Promise<{ error: boolean; message?: string; data?: AssignAdAccountResponse["data"] }> => {
  if (!clientId) {
    return { error: true, message: "clientId is required" };
  }

  if (!fbAdAccountId) {
    return { error: true, message: "fbAdAccountId is required" };
  }

  const response = await doPUT(
    `${API_ENDPOINTS.USER_FB_AD_ACCOUNT}/${clientId}`,
    { fbAdAccountId }
  );

  if (!response.error && response.data?.success) {
    return { error: false, data: response.data.data, message: response.data.message };
  }

  return {
    error: true,
    message: response.data?.error || response.message || "Failed to assign ad account",
  };
};

/**
 * Get user profile by ID (includes fbAdAccountId and metaAccessToken for admin)
 * @param userId - The user ID
 * @returns User profile response
 */
export const getUserProfile = async (
  userId: string
): Promise<{
  error: boolean;
  message?: string;
  data?: {
    id: string;
    email: string;
    name?: string;
    role: string;
    fbAdAccountId?: string;
    metaAccessToken?: string;
    [key: string]: unknown;
  };
}> => {
  if (!userId) {
    return { error: true, message: "userId is required" };
  }

  const response = await doGET(`${API_ENDPOINTS.USER_GET_BY_ID}/${userId}/`);

  if (!response.error && response.data?.success) {
    return { error: false, data: response.data.data };
  }

  return {
    error: true,
    message: response.data?.error || response.message || "Failed to fetch user profile",
  };
};

