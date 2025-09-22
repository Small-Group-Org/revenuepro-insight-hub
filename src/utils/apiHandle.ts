import axios, { AxiosError, AxiosResponse } from "axios";
import { STORAGE_KEYS, getValue, removeValue } from "./storage";
import {API_METHODS, API_URL} from "./constant";
import useAuthStore from "@/stores/authStore";

export const api = axios.create({
    baseURL: API_URL
});

const isFormData = (value: unknown): value is FormData => value instanceof FormData;

type ApiResponse<T = unknown> = {
    error: boolean;
    message: string;
    status: number;
    data: T | null;
};

const apiHandler = async (
    endPoint: string,
    method: string,
    data: unknown = null
): Promise<ApiResponse> => {
    try {
        const contentType: string = isFormData(data) ? "multipart/form-data" : "application/json";
        
        // Add LEADS_API_KEY header for specific endpoints
        const leadsApiKeyHeaders = endPoint.includes('/process-lead-sheet') ? {
            "LEADS_API_KEY": "407e72af81d701490db65daf1775224c64bb097fcb52d59e05720a252677d051"
        } : {};
        
        const response: AxiosResponse = await api({
            method: method,
            url: endPoint,
            ...(data !== null && { data: data }),
            headers: {
                ...(data !== null && { "Content-Type": contentType }),
                "accessToken" : `${getValue(STORAGE_KEYS.ACCESS_TOKEN)}`,
                "refreshToken" : `${getValue(STORAGE_KEYS.REFRESH_TOKEN)}`,
                "Accept": "application/json",
                ...leadsApiKeyHeaders,
            },
        });

        return { error: false, message: "", status: response.status, data: response.data };
    } catch (error) {
        // Default error message
        let errorMessage = 'An error occurred.';
        let statusCode = 500;

        if (error instanceof AxiosError) {
            errorMessage = error.response?.data?.message || error.message;
            statusCode = error.response?.status || 500;
        } else if (error instanceof Error) {
            errorMessage = error.message;
        }

        // Handle 401 Unauthorized error
        if (statusCode === 401) {
            // Clear auth tokens
            removeValue(STORAGE_KEYS.ACCESS_TOKEN);
            removeValue(STORAGE_KEYS.REFRESH_TOKEN);
            
            // Get the logout function from auth store
            const logout = useAuthStore.getState().logout;
            logout();
            
            // Redirect to login page
            window.location.href = '/login';
            
            errorMessage = 'Session expired. Please login again.';
        }

        return { error: true, message: errorMessage, status: statusCode, data: null };
    }
};

export default apiHandler;