import axios from "axios";
import { Platform } from "react-native";

const getApiUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) {
    return envUrl;
  }

  if (Platform.OS === "web" && typeof window !== "undefined") {
    const { protocol, hostname } = window.location;
    return `${protocol}//${hostname}:3000/api`;
  }

  if (Platform.OS === "android") {
    return "http://10.0.2.2:3000/api";
  }

  return "http://localhost:3000/api";
};

const API_URL = getApiUrl();

export interface LoginResponse {
  success: boolean;
  token: string;
  user: {
    id: string;
    nom: string;
    prenom: string;
    email: string;
  };
}

export interface RegisterPayload {
  nom: string;
  prenom: string;
  email: string;
  password: string;
  telephone?: string;
  adresse?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
}

export interface ResetPasswordPayload {
  email: string;
  code: string;
  newPassword: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

class AuthService {
  async register(data: RegisterPayload): Promise<any> {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  }

  async login(data: LoginPayload): Promise<LoginResponse> {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  }

  async forgotPassword(
    data: ForgotPasswordPayload,
  ): Promise<ForgotPasswordResponse> {
    try {
      const response = await axios.post(`${API_URL}/auth/forgot-password`, data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  }

  async resetPassword(
    data: ResetPasswordPayload,
  ): Promise<ResetPasswordResponse> {
    try {
      const response = await axios.post(`${API_URL}/auth/reset-password`, data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  }

  async logout(): Promise<any> {
    try {
      const response = await axios.post(`${API_URL}/auth/logout`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  }

  async getCurrentUser(token: string): Promise<any> {
    try {
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  }
}

export default new AuthService();
