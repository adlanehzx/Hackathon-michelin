import axios from "axios";
import { Platform } from "react-native";

const getApiUrl = () => {
  const webUrl = process.env.EXPO_PUBLIC_API_URL_WEB;
  const mobileUrl = process.env.EXPO_PUBLIC_API_URL_MOBILE;
  const fallbackUrl = process.env.EXPO_PUBLIC_API_URL;

  if (Platform.OS === "web") {
    if (webUrl) {
      return webUrl;
    }

    if (fallbackUrl) {
      return fallbackUrl;
    }

    return "http://localhost:3000/api";
  }

  if (mobileUrl) {
    return mobileUrl;
  }

  if (fallbackUrl) {
    return fallbackUrl;
  }

  if (Platform.OS === "android") {
    return "http://10.0.2.2:3000/api";
  }

  return "http://localhost:3000/api";
};

const API_URL = getApiUrl();

export interface FeedVideo {
  video_id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  username: string;
  user_avatar: string;
  restaurant_name: string;
  tags: string;
  view_count: number;
  like_count: number;
  compatibility_score: number;
  already_interacted: boolean;
}

export interface Tag {
  id: string;
  name: string;
  category: string;
  icon: string;
}

export interface VideoPayload {
  userId: string;
  restaurantId?: string;
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
  minAge?: number;
  maxAge?: number;
  tags?: string[];
}

export interface InteractionPayload {
  userId: string;
  videoId: string;
  interactionType: "view" | "like" | "skip";
  watchDurationSeconds?: number;
}

class FeedService {
  async getPersonalizedFeed(
    userId: string,
    limit = 10,
    offset = 0,
  ): Promise<FeedVideo[]> {
    try {
      const response = await axios.get(
        `${API_URL}/feed/feed/${userId}?limit=${limit}&offset=${offset}`,
      );
      return response.data.data || [];
    } catch (error) {
      console.error("Erreur lors de la récupération du feed:", error);
      return [];
    }
  }

  async getVideoById(videoId: string): Promise<any> {
    try {
      const response = await axios.get(`${API_URL}/feed/video/${videoId}`);
      return response.data.data;
    } catch (error) {
      console.error("Erreur lors de la récupération de la vidéo:", error);
      return null;
    }
  }

  async createVideo(payload: VideoPayload): Promise<any> {
    try {
      const response = await axios.post(`${API_URL}/feed/create`, {
        userId: payload.userId,
        restaurantId: payload.restaurantId,
        title: payload.title,
        description: payload.description,
        videoUrl: payload.videoUrl,
        thumbnailUrl: payload.thumbnailUrl,
        durationSeconds: payload.durationSeconds,
        minAge: payload.minAge || 13,
        maxAge: payload.maxAge || 120,
        tags: payload.tags || [],
      });
      return response.data.data;
    } catch (error) {
      console.error("Erreur lors de la création de la vidéo:", error);
      return null;
    }
  }

  async recordInteraction(payload: InteractionPayload): Promise<any> {
    try {
      const response = await axios.post(`${API_URL}/feed/interact`, {
        userId: payload.userId,
        videoId: payload.videoId,
        interactionType: payload.interactionType,
        watchDurationSeconds: payload.watchDurationSeconds || 0,
      });
      return response.data.data;
    } catch (error) {
      console.error("Erreur lors de l'enregistrement de l'interaction:", error);
      return null;
    }
  }

  async getTags(category?: string): Promise<Tag[]> {
    try {
      const url = category
        ? `${API_URL}/feed/tags?category=${category}`
        : `${API_URL}/feed/tags`;
      const response = await axios.get(url);
      return response.data.data || [];
    } catch (error) {
      console.error("Erreur lors de la récupération des tags:", error);
      return [];
    }
  }

  async getUserVideos(userId: string, limit = 20, offset = 0): Promise<any[]> {
    try {
      const response = await axios.get(
        `${API_URL}/feed/user/${userId}?limit=${limit}&offset=${offset}`,
      );
      return response.data.data || [];
    } catch (error) {
      console.error("Erreur lors de la récupération des vidéos:", error);
      return [];
    }
  }

  async deleteVideo(videoId: string, userId: string): Promise<boolean> {
    try {
      await axios.delete(`${API_URL}/feed/${videoId}`, {
        data: { userId },
      });
      return true;
    } catch (error) {
      console.error("Erreur lors de la suppression de la vidéo:", error);
      return false;
    }
  }
}

export default new FeedService();
