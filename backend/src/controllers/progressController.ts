import { Request, Response } from "express";
import { supabase } from "../config/supabase";
import { AuthRequest } from "../types/index";

async function buildProgressResponse(userId: string | number) {
  let { data: progress } = await supabase
    .from("user_progress")
    .select("*, levels(*)")
    .eq("user_id", userId)
    .single();

  if (!progress) {
    const { data: levelOne } = await supabase
      .from("levels")
      .select("*")
      .eq("level_number", 1)
      .single();

    const { data: created, error } = await supabase
      .from("user_progress")
      .insert([
        {
          user_id: userId,
          current_level_id: levelOne?.id,
          total_xp: 0,
          is_roi_gourmet: false,
        },
      ])
      .select("*, levels(*)")
      .single();

    if (error) throw error;
    progress = created;
  }

  const { data: nextLevel } = await supabase
    .from("levels")
    .select("*")
    .gt("xp_required", progress.total_xp)
    .order("xp_required", { ascending: true })
    .limit(1)
    .single();

  const { data: completedChallenges } = await supabase
    .from("user_challenges")
    .select("challenge_id")
    .eq("user_id", userId);

  const { data: earnedBadges } = await supabase
    .from("user_badges")
    .select("badge_id")
    .eq("user_id", userId);

  const { count: totalChallenges } = await supabase
    .from("challenges")
    .select("*", { count: "exact", head: true });

  const { count: totalBadges } = await supabase
    .from("badges")
    .select("*", { count: "exact", head: true });

  return {
    total_xp: progress.total_xp,
    is_roi_gourmet: progress.is_roi_gourmet,
    current_level: progress.levels,
    next_level: nextLevel || null,
    xp_to_next_level: nextLevel ? nextLevel.xp_required - progress.total_xp : 0,
    challenges_completed: completedChallenges?.length || 0,
    challenges_total: totalChallenges || 0,
    badges_earned: earnedBadges?.length || 0,
    badges_total: totalBadges || 0,
  };
}

export const getMyProgress = async (req: AuthRequest, res: Response) => {
  try {
    const data = await buildProgressResponse(req.user!.id);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getUserProgress = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;

    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .single();

    if (!user) {
      return res.status(404).json({ success: false, error: "Utilisateur introuvable" });
    }

    const data = await buildProgressResponse(userId);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
