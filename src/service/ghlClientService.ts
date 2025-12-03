import { doGET, doPOST, doPUT } from "@/utils/HttpUtils";
import { API_ENDPOINTS } from "@/utils/constant";

export interface CreateGhlClientRequest {
  locationId: string;
  ghlApiToken: string;
  queryValue: string;
  queryValue2?: string;
  revenueProClientId: string;
  status: 'active' | 'inactive';
}

export interface GhlClient {
  id: string;
  locationId: string;
  queryValue: string;
  customFieldId?: string;
  queryValue2?: string | null;
  customFieldId2?: string | null;
  revenueProClientId: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt?: string;
}

export interface GhlClientWithToken extends GhlClient {
  ghlApiToken: string; // Only available in GET by locationId
}

export interface UpdateGhlClientRequest {
  locationId?: string;
  ghlApiToken?: string;
  queryValue?: string;
  queryValue2?: string | null;
  status?: 'active' | 'inactive';
}

// Create GHL Client
export const createGhlClient = async (
  data: CreateGhlClientRequest
): Promise<{ error: boolean; message?: string; data?: GhlClient }> => {
  const response = await doPOST(API_ENDPOINTS.GHL_CLIENTS, data);
  if (!response.error && response.data?.data) {
    return { error: false, data: response.data.data };
  }
  return { error: true, message: response.message || "Failed to create GHL client" };
};

// Get All GHL Clients
export const getAllGhlClients = async (): Promise<{
  error: boolean;
  message?: string;
  data?: GhlClient[];
}> => {
  const response = await doGET(API_ENDPOINTS.GHL_CLIENTS);
  if (!response.error && response.data?.data) {
    return { error: false, data: response.data.data };
  }
  return { error: true, message: response.message || "Failed to fetch GHL clients" };
};

// Get GHL Client by Location ID (returns decrypted token)
export const getGhlClientByLocation = async (
  locationId: string
): Promise<{
  error: boolean;
  message?: string;
  data?: GhlClientWithToken;
}> => {
  const response = await doGET(
    `${API_ENDPOINTS.GHL_CLIENTS}/${encodeURIComponent(locationId)}`
  );
  if (!response.error && response.data?.data) {
    return { error: false, data: response.data.data };
  }
  return {
    error: true,
    message: response.message || "Failed to fetch GHL client",
  };
};

// Update GHL Client (by locationId)
export const updateGhlClient = async (
  locationId: string,
  data: UpdateGhlClientRequest
): Promise<{ error: boolean; message?: string; data?: GhlClient }> => {
  const response = await doPUT(
    `${API_ENDPOINTS.GHL_CLIENTS}/${encodeURIComponent(locationId)}`,
    data
  );
  if (!response.error && response.data?.data) {
    return { error: false, data: response.data.data };
  }
  return { error: true, message: response.message || "Failed to update GHL client" };
};

// Trigger Opportunity Sync for specific clients
export const triggerOpportunitySync = async (
  locationIds: string[]
): Promise<{ error: boolean; message?: string }> => {
  const response = await doPOST(API_ENDPOINTS.ADMIN_OPPORTUNITY_SYNC_TRIGGER, {
    locationIds,
  });
  if (!response.error) {
    return { error: false };
  }
  return { error: true, message: response.message || "Failed to trigger opportunity sync" };
};

// Trigger Lead Sheet Sync (runs in background)
export const triggerLeadSheetSync = async (): Promise<{ error: boolean; message?: string }> => {
  const response = await doPOST(API_ENDPOINTS.ADMIN_LEAD_SHEET_SYNC_TRIGGER, {});
  if (!response.error) {
    return { error: false };
  }
  return { error: true, message: response.message || "Failed to trigger lead sheet sync" };
};

