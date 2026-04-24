import { Request, Response } from "express";
import { supabase } from "../config/supabase";

export const getPersonalizedFeed = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { limit = 10, offset = 0 } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId est obligatoire",
      });
    }

   
    const { data, error } = await supabase.rpc("get_personalized_feed", {
      p_user_id: userId,
      p_limit: parseInt(limit as string) || 10,
      p_offset: parseInt(offset as string) || 0,
    });

    if (error) {
      return res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération du feed",
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      data: data || [],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message,
    });
  }
};


export const getVideoById = async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;

    const { data, error } = await supabase
      .from("feed_videos")
      .select(
        `
        *,
        users:user_id(nom, prenom, avatar_url),
        restaurants:restaurant_id(name, area, cuisine_type, michelin_stars),
        video_tags(tags(name, icon, category))
      `
      )
      .eq("id", videoId)
      .single();

    if (error) {
      return res.status(404).json({
        success: false,
        message: "Vidéo non trouvée",
      });
    }

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message,
    });
  }
};


export const createVideo = async (req: Request, res: Response) => {
  try {
    const {
      userId,
      restaurantId,
      title,
      description,
      videoUrl,
      thumbnailUrl,
      durationSeconds,
      minAge = 13,
      maxAge = 120,
      tags = [],
    } = req.body;

    if (!userId || !videoUrl || !title) {
      return res.status(400).json({
        success: false,
        message: "userId, videoUrl et title sont obligatoires",
      });
    }

    
    const { data: video, error: videoError } = await supabase
      .from("feed_videos")
      .insert([
        {
          user_id: userId,
          restaurant_id: restaurantId || null,
          title,
          description: description || null,
          video_url: videoUrl,
          thumbnail_url: thumbnailUrl || null,
          duration_seconds: durationSeconds || null,
          min_age_recommended: minAge,
          max_age_recommended: maxAge,
        },
      ])
      .select()
      .single();

    if (videoError) {
      return res.status(500).json({
        success: false,
        message: "Erreur lors de la création de la vidéo",
        error: videoError.message,
      });
    }

    
    if (tags.length > 0) {
      const videoTags = tags.map((tagId: string) => ({
        video_id: video.id,
        tag_id: tagId,
      }));

      const { error: tagsError } = await supabase
        .from("video_tags")
        .insert(videoTags);

      if (tagsError) {
        console.error("Erreur lors de l'ajout des tags:", tagsError);
      }
    }

    return res.status(201).json({
      success: true,
      data: video,
      message: "Vidéo créée avec succès",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message,
    });
  }
};


export const recordInteraction = async (req: Request, res: Response) => {
  try {
    const { userId, videoId, interactionType, watchDurationSeconds = 0 } =
      req.body;

    if (!userId || !videoId || !interactionType) {
      return res.status(400).json({
        success: false,
        message: "userId, videoId et interactionType sont obligatoires",
      });
    }

    if (!["view", "like", "skip"].includes(interactionType)) {
      return res.status(400).json({
        success: false,
        message: "interactionType doit être 'view', 'like' ou 'skip'",
      });
    }

    
    const { data, error } = await supabase
      .from("user_interactions")
      .upsert(
        {
          user_id: userId,
          video_id: videoId,
          interaction_type: interactionType,
          watch_duration_seconds: watchDurationSeconds,
        },
        {
          onConflict: "user_id, video_id, interaction_type",
        }
      )
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        message: "Erreur lors de l'enregistrement de l'interaction",
        error: error.message,
      });
    }

    
    if (interactionType === "like") {
      await supabase.rpc("increment_video_likes", {
        video_id: videoId,
      });
    } else if (interactionType === "view") {
      await supabase.rpc("increment_video_views", {
        video_id: videoId,
      });
    }

    return res.status(200).json({
      success: true,
      data,
      message: "Interaction enregistrée",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message,
    });
  }
};


export const getAllTags = async (req: Request, res: Response) => {
  try {
    const { category } = req.query;

    let query = supabase.from("tags").select("*");

    if (category) {
      query = query.eq("category", category);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération des tags",
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      data: data || [],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message,
    });
  }
};

export const getUserVideos = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const { data, error } = await supabase
      .from("feed_videos")
      .select(
        `
        *,
        restaurants:restaurant_id(name, area),
        video_tags(tags(name, icon))
      `
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(
        parseInt(offset as string),
        parseInt(offset as string) + parseInt(limit as string) - 1
      );

    if (error) {
      return res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération des vidéos",
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      data: data || [],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message,
    });
  }
};

export const deleteVideo = async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;
    const { userId } = req.body;

    if (!videoId || !userId) {
      return res.status(400).json({
        success: false,
        message: "videoId et userId sont obligatoires",
      });
    }

    const { data: video } = await supabase
      .from("feed_videos")
      .select("user_id")
      .eq("id", videoId)
      .single();

    if (video?.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "Vous n'êtes pas autorisé à supprimer cette vidéo",
      });
    }

    await supabase.from("video_tags").delete().eq("video_id", videoId);

    await supabase
      .from("user_interactions")
      .delete()
      .eq("video_id", videoId);

    const { error } = await supabase
      .from("feed_videos")
      .delete()
      .eq("id", videoId);

    if (error) {
      return res.status(500).json({
        success: false,
        message: "Erreur lors de la suppression de la vidéo",
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Vidéo supprimée avec succès",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message,
    });
  }
};
