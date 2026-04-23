import axios from "axios";
import { Platform } from "react-native";

const getApiUrl = () => {
  const webUrl = process.env.EXPO_PUBLIC_API_URL_WEB;
  const mobileUrl = process.env.EXPO_PUBLIC_API_URL_MOBILE;
  const fallbackUrl = process.env.EXPO_PUBLIC_API_URL;

  if (Platform.OS === "web") {
    return webUrl || fallbackUrl || "http://localhost:3000/api";
  }

  if (mobileUrl) return mobileUrl;
  if (fallbackUrl) return fallbackUrl;
  if (Platform.OS === "android") return "http://10.0.2.2:3000/api";

  return "http://localhost:3000/api";
};

const API_URL = getApiUrl();

const authHeaders = (token: string) => ({
  headers: { Authorization: `Bearer ${token}` },
});

class GamificationService {
  async getMyProgress(token: string) {
    const res = await axios.get(`${API_URL}/progress/me`, authHeaders(token));
    return res.data.data;
  }

  async getMyBadges(token: string) {
    const res = await axios.get(`${API_URL}/badges/me`, authHeaders(token));
    return res.data.data;
  }

  async getMyChallenges(token: string) {
    const res = await axios.get(`${API_URL}/challenges/me`, authHeaders(token));
    return res.data;
  }
}

export default new GamificationService();
