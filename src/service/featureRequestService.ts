import { doPOST } from "@/utils/HttpUtils";
import { API_ENDPOINTS } from "@/utils/constant";

export interface CreateFeatureRequestPayload {
  title: string;
  description: string;
}

export interface FeatureRequestResponse {
  success: boolean;
  message: string;
  data?: {
    title: string;
    description: string;
    submittedAt: string;
  };
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
