import axios from "axios";
import { STORAGE_KEYS, getValue, removeValue } from "./storage";
import {API_METHODS, API_URL} from "./constant";
import useAuthStore from "@/stores/authStore";

export const api = axios.create({
    baseURL: API_URL
});

const isFormData = (value: unknown): value is FormData => value instanceof FormData;

const apiHandler = async (endPoint: any, method: string, data = null) => {
    try {
        const contentType: string = isFormData(data) ? "multipart/form-data" : "application/json";
        const response = await api({
            method: method,
            url: endPoint,
            ...(![API_METHODS.GET].includes(method) && { data: data }),
            headers: {
                "Content-Type": contentType,
                "accessToken" : `${getValue(STORAGE_KEYS.ACCESS_TOKEN)}`,
                "refreshToken" : `${getValue(STORAGE_KEYS.REFRESH_TOKEN)}`,
                "Accept": "application/json",
            },
        });

        return { error: false, message: "", status: response?.status, data: response?.data };
    } catch (error: any) {
        // Default error message
        let errorMessage = 'An error occurred.';
        let statusCode = 500;

        if (error?.response?.data?.message) {
            errorMessage = error.response.data.message;
            statusCode = error.response.status;
        } else if (error?.message) {
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