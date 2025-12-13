import { doPOST } from "@/utils/HttpUtils";
import { API_ENDPOINTS } from "@/utils/constant";
import {
  PerformanceBoardRequest,
  PerformanceRow,
} from "@/types/adPerformanceBoard";

interface PerformanceBoardServiceResponse {
  error: boolean;
  message?: string;
  data?: PerformanceRow[];
  availableZipCodes?: string[];
  availableServiceTypes?: string[];
}

export const fetchAdPerformanceBoard = async (
  payload: PerformanceBoardRequest
): Promise<PerformanceBoardServiceResponse> => {
  const { clientId, ...body } = payload;
  const query = new URLSearchParams({ clientId }).toString();

  const response = await doPOST(
    `${API_ENDPOINTS.FACEBOOK_AD_PERFORMANCE_BOARD}?${query}`,
    body
  );

  if (!response.error) {
    const responseData = response.data as any;
    // some endpoints wrap in data.data, keep both
    const rows =
      responseData?.data ??
      (Array.isArray(responseData) ? responseData : responseData?.rows);

    return {
      error: false,
      data: rows as PerformanceRow[],
      availableZipCodes: responseData?.availableZipCodes,
      availableServiceTypes: responseData?.availableServiceTypes,
    };
  }

  return {
    error: true,
    message: response.message || "Unable to load ad performance board",
  };
};

