import axios from "axios";

// Détecte l'environnement: Docker (backend) ou localhost (dev local)
const API_URL =
  typeof window !== "undefined" &&
  window.location.hostname.includes("localhost")
    ? "http://localhost:3000/api"
    : "http://backend:3000/api";

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
