import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
// import { toast } from 'react-toastify';
import { doGET } from "../utils/HttpUtils";
import useAuthStore from "@/stores/authStore";
import { useNavigate } from "react-router-dom";
import { STORAGE_KEYS } from "./storage";
import { verifyToken } from "@/service/authService";
import { useToast } from "@/hooks/use-toast";

// Types
interface User {
  id?: string;
  name?: string;
  email?: string;
  role?: string; // Add role here
  // Add other user properties as needed
}

interface UserContextType {
  isVerifying: boolean;
  user: User | null;
  setUser: (val: User | null) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Hook
export const useUserContext = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUserContext must be used within a UserProvider");
  }
  return context;
};

// Provider Props
interface UserProviderProps {
  children: ReactNode;
}

// Provider
export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const { toast } = useToast();

  

  useEffect(() => {
    checkExistingToken();
  }, []);

  const contextValue: UserContextType = {
    user,
    setUser,
    isVerifying,
  };

  const checkExistingToken = async () => {
    const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

    if (accessToken && refreshToken) {
      setIsVerifying(true);
      try {
        const response = await verifyToken(accessToken, refreshToken);
        if (response?.status === 403) {
          toast({
            title: "Error",
            description: "Please request permission from the administrator to access this resource - tushar.mangla1120@gmail.com",
            variant: "destructive",
          });
          navigate("/login");
          return;
        }
        
        if (response?.status === 200 && response?.data?.user) {
          setUser(response.data.user);
          login();
          navigate("/");
          return;
        }

        // If we get here, something went wrong with verification
        toast({
          title: "Session Expired",
          description: "Please login again",
          variant: "destructive",
        });
        navigate("/login");
       
      } catch (error) {
        console.error("Token verification failed:", error);
        toast({
          title: "Error",
          description: "Authentication failed. Please login again.",
          variant: "destructive",
        });
        navigate("/login");
      } finally {
        setIsVerifying(false);
      }
    } else {
      navigate("/login");
    }
  };

  return <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>;
};
