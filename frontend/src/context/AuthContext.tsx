import React, { createContext, useState, useContext, useEffect } from "react";
import storage from "../utils/storage";
import authService, { LoginResponse } from "../services/authService";

interface User {
  id: string;
  nom: string;
  prenom: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isSignedIn: boolean;
  register: (
    nom: string,
    prenom: string,
    email: string,
    password: string,
  ) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  restoreToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    restoreToken();
  }, []);

  const restoreToken = async () => {
    try {
      const savedToken = await storage.getItem("authToken");
      if (savedToken) {
        setToken(savedToken);
      }
    } catch (error) {
      console.error("Error restoring token:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    nom: string,
    prenom: string,
    email: string,
    password: string,
  ) => {
    try {
      await authService.register({ nom, prenom, email, password });
    } catch (error: any) {
      throw error.error || "Erreur lors de l'inscription";
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response: LoginResponse = await authService.login({
        email,
        password,
      });
      setUser(response.user);
      setToken(response.token);
      await storage.setItem("authToken", response.token);
    } catch (error: any) {
      throw error.error || "Erreur lors de la connexion";
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      setToken(null);
      await storage.removeItem("authToken");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isSignedIn: !!token,
    register,
    login,
    logout,
    restoreToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
