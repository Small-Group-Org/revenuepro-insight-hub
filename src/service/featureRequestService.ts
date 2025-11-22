import { doPOST, doGET, doPUT } from "@/utils/HttpUtils";
import { API_ENDPOINTS } from "@/utils/constant";

export interface CreateFeatureRequestPayload {
  title: string;
  description: string;
}

export interface FeatureRequestResponse {
  success: boolean;
  message: string;
  data?: {
    _id: string;
    userId: string;
    userName: string;
    userEmail: string;
    title: string;
    description: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  };
}

export interface FeatureRequest {
  _id: string;
  userId: string;
  userName: string;
  userEmail: string;
  title: string;
  description: string;
  status: 'new' | 'accepted' | 'rejected' | 'information_needed';
  createdAt: string;
  updatedAt: string;
}

// Create a new feature request
export const createFeatureRequest = async (
  payload: CreateFeatureRequestPayload
): Promise<{ error: boolean; data?: FeatureRequestResponse; message?: string }> => {
  try {
    const response = await doPOST(API_ENDPOINTS.FEATURE_REQUESTS, payload);
    
    if ((response.status === 200 || response.status === 201) && response.data?.success) {
      return { error: false, data: response.data };
    } else {
      return { error: true, message: response.message || "Failed to submit feature request" };
    }
  } catch (error) {
    console.error("Error submitting feature request:", error);
    return { 
      error: true, 
      message: error instanceof Error ? error.message : "Failed to submit feature request" 
    };
  }
};

// Get all feature requests
export const getFeatureRequests = async (filters?: {
  status?: string;
}): Promise<{ error: boolean; data?: { success: boolean; data: FeatureRequest[] }; message?: string }> => {
  try {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    
    const queryString = params.toString();
    const url = queryString ? `${API_ENDPOINTS.FEATURE_REQUESTS}?${queryString}` : API_ENDPOINTS.FEATURE_REQUESTS;
    
    const response = await doGET(url);
    
    if ((response.status === 200 || response.status === 201) && response.data?.success) {
      return { error: false, data: response.data };
    } else {
      return { error: true, message: response.message || "Failed to fetch feature requests" };
    }
  } catch (error) {
    console.error("Error fetching feature requests:", error);
    return { 
      error: true, 
      message: error instanceof Error ? error.message : "Failed to fetch feature requests" 
    };
  }
};

// Update feature request (Admin only)
export const updateFeatureRequest = async (
  id: string,
  data: { status?: string }
): Promise<{ error: boolean; data?: FeatureRequestResponse; message?: string }> => {
  try {
    const response = await doPUT(`${API_ENDPOINTS.FEATURE_REQUESTS}/${id}`, data);
    
    if ((response.status === 200 || response.status === 201) && response.data?.success) {
      return { error: false, data: response.data };
    } else {
      return { error: true, message: response.message || "Failed to update feature request" };
    }
  } catch (error) {
    console.error("Error updating feature request:", error);
    return { 
      error: true, 
      message: error instanceof Error ? error.message : "Failed to update feature request" 
    };
  }
};
