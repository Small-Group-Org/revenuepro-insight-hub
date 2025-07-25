import { doGET, doPOST } from "@/utils/HttpUtils";
import { STORAGE_KEYS } from "@/utils/storage";

interface LoginResponse {
  status: number;
  data?: {
    accessToken: string;
    refreshToken: string;
    user: {
      id: string;
      name: string;
      email: string;
      role?: string; // Add role here
    };
  };
  message?: string;
}

interface VerifyResponse {
  status: number;
  data?: {
    user: {
      id: string;
      name: string;
      email: string;
      role?: string; // Add role here
    };
    newAccessToken?: string;
  };
  message?: string;
}

export const login = async (email: string, password: string): Promise<LoginResponse> => {
  try {
    const response = await doPOST(`/auth/login`, {
      email,
      password
    });

    if (response.status === 200 && response.data) {
      // Store tokens
      const accessToken = response.data.token.accessToken;
      const refreshToken = response.data.token.refreshToken;
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      return response;
    }
    return response;
  } catch (error) {
    console.error("Error logging in:", error);
    return {
      status: 500,
      message: "An error occurred during login"
    };
  }
};

export const verifyToken = async (accessToken: string, refreshToken: string): Promise<VerifyResponse> => {
  try {
    const response = await doPOST(`/auth/verify-token`, {
      accessToken,
      refreshToken
    });

    if (response.status === 200 && response.data) {
      // If a new access token is provided, update it
      if (response.data.newAccessToken) {
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, response.data.newAccessToken);
      }
      return {
        status: 200,
        data: response.data
      };
    }
    
    return {
      status: response.status,
      message: response.message || "Token verification failed"
    };
  } catch (error) {
    console.error("Error verifying token:", error);
    return {
      status: 500,
      message: "An error occurred during token verification"
    };
  }
};

export const logout = () => {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
};