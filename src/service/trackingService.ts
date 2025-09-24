import { doPUT } from "@/utils/HttpUtils";
import { API_ENDPOINTS } from "@/utils/constant";

interface TrackingResponse {
  error: boolean;
  message: string;
  status: number;
  data?: any;
}

export const trackUserLogin = async (userId: string): Promise<TrackingResponse> => {
  try {
    const response = await doPUT(API_ENDPOINTS.IP_TRACK, { userId });
    return response;
  } catch (error) {
    console.error("Error tracking user login:", error);
    return {
      error: true,
      message: "An error occurred during tracking",
      status: 500
    };
  }
};
