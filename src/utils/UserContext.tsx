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
  // Add other user properties as needed
}

interface Project {
  _id?: string;
  name?: string;
  // Add other project properties as needed
}

interface Product {
  id: string;
  title: string;
  price: number;
  // Add other product properties as needed
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
  }, [login]);

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
        const isTokenValid = await verifyToken(accessToken, refreshToken);
         if (isTokenValid?.status === 403) {
          toast({
            title: "Error",
            description: "Please request permission from the administrator to access this resource - tushar.mangla1120@gmail.com",
            variant: "destructive",
          });

          navigate("/login");
        }
        if (isTokenValid.status === 200) {
          login();
          return;
        }
       
      } catch (error) {
        console.error("Token verification failed:", error);
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
