import { doPUT } from "@/utils/HttpUtils";
import { STORAGE_KEYS, getValue } from "@/utils/storage";

interface TrackingResponse {
  error: boolean;
  message: string;
  status: number;
  data?: any;
}

export const trackUserLogin = async (userId: string): Promise<TrackingResponse> => {
  try {
    const response = await doPUT("/ip-tracking/track", { userId });
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
