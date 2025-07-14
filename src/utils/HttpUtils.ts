import { STORAGE_KEYS, getValue } from './storage'
import apiHandler from "./apiHandle";
import { API_METHODS } from "./constant";

interface ApiResponse {
  error: boolean;
  message: string;
  status: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any; // We keep this as any since the data structure varies by endpoint
}

const token = getValue(STORAGE_KEYS.ACCESS_TOKEN);

export const doGET = async (url: string): Promise<ApiResponse> => {
  const response = await apiHandler(url, API_METHODS.GET);
  return response;
};

export const doPOST = async (url: string, data: unknown): Promise<ApiResponse> => {
  const response = await apiHandler(url, API_METHODS.POST, data);
  return response;
};

export const doDELETE = async (url: string): Promise<ApiResponse> => {
  const response = await apiHandler(url, API_METHODS.DELETE);
  return response;
};

export const doPUT = async (url: string, data: unknown): Promise<ApiResponse> => {
  const response = await apiHandler(url, API_METHODS.PUT, data);
  return response;
};

