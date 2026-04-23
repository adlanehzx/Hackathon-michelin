import { Response } from "express";
import { supabase } from "../config/supabase";
import { AuthRequest } from "../types/index";

export const getAllChallenges = async (req: AuthRequest, res: Response) => {
  try {
    const { data, error } = await supabase
      .from("challenges")
      .select("*, challenge_categories(id, name, icon_url)")
      .order("difficulty");

    if (error) throw error;

    res.json({ success: true, count: data?.length || 0, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getChallengeById = async (req: AuthRequest, res: Response) => {
  try {
    const { data, error } = await supabase
      .from("challenges")
      .select("*, challenge_categories(id, name, icon_url)")
      .eq("id", req.params.id)
      .single();

    if (error) {
      return res.status(404).json({ success: false, error: "Défi introuvable" });
    }

    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getMyChallenges = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const { data: allChallenges, error: chErr } = await supabase
      .from("challenges")
      .select("*, challenge_categories(id, name, icon_url)");

    if (chErr) throw chErr;

    const { data: completed, error: ucErr } = await supabase
      .from("user_challenges")
      .select("challenge_id, completed_at, proof_url")
      .eq("user_id", userId);

    if (ucErr) throw ucErr;

    const completedMap = new Map(
      (completed || []).map((uc: any) => [uc.challenge_id, uc])
    );

    const data = (allChallenges || []).map((ch: any) => {
      const uc = completedMap.get(ch.id);
      return {
        ...ch,
        completed: !!uc,
        completed_at: uc ? uc.completed_at : null,
        proof_url: uc ? uc.proof_url : null,
      };
    });

    res.json({
      success: true,
      total: data.length,
      completed_count: completed?.length || 0,
      data,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const completeChallenge = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const challengeId = req.params.id;
    const { proof_url } = req.body;

    const { data: challenge, error: chErr } = await supabase
      .from("challenges")
      .select("*")
      .eq("id", challengeId)
      .single();

    if (chErr || !challenge) {
      return res.status(404).json({ success: false, error: "Défi introuvable" });
    }

    const { data: existing } = await supabase
      .from("user_challenges")
      .select("user_id")
      .eq("user_id", userId)
      .eq("challenge_id", challengeId)
      .single();

    if (existing) {
      return res.status(400).json({ success: false, error: "Défi déjà complété" });
    }

    if (challenge.proof_required && !proof_url) {
      return res.status(400).json({
        success: false,
        error: "Ce défi nécessite une preuve (proof_url)",
      });
    }

    const { error: insertErr } = await supabase.from("user_challenges").insert([
      {
        user_id: userId,
        challenge_id: challengeId,
        proof_url: proof_url || null,
      },
    ]);

    if (insertErr) throw insertErr;

    let { data: progress } = await supabase
      .from("user_progress")
      .select("*")
      .eq("user_id", userId)
      .single();

    const { data: levelOne } = await supabase
      .from("levels")
      .select("id")
      .eq("level_number", 1)
      .single();

    if (!progress) {
      const { data: created, error: createErr } = await supabase
        .from("user_progress")
        .insert([
          {
            user_id: userId,
            current_level_id: levelOne?.id,
            total_xp: 0,
            is_roi_gourmet: false,
          },
        ])
        .select()
        .single();

      if (createErr) throw createErr;
      progress = created;
    }

    const newTotalXp = (progress.total_xp || 0) + challenge.xp_reward;

    await supabase
      .from("user_progress")
      .update({ total_xp: newTotalXp })
      .eq("user_id", userId);

    const badgesUnlocked: string[] = [];

    const { data: candidateBadges } = await supabase
      .from("badge_requirements")
      .select("badge_id")
      .eq("challenge_id", challengeId);

    const badgeIds = [...new Set((candidateBadges || []).map((br: any) => br.badge_id))];

    for (const badgeId of badgeIds) {
      const { data: alreadyOwned } = await supabase
        .from("user_badges")
        .select("badge_id")
        .eq("user_id", userId)
        .eq("badge_id", badgeId)
        .single();

      if (alreadyOwned) continue;

      const { data: badge } = await supabase
        .from("badges")
        .select("*")
        .eq("id", badgeId)
        .single();

      if (!badge) continue;

      const { data: requiredChallenges } = await supabase
        .from("badge_requirements")
        .select("challenge_id")
        .eq("badge_id", badgeId);

      const requiredIds = (requiredChallenges || []).map((r: any) => r.challenge_id);

      const { data: userCompleted } = await supabase
        .from("user_challenges")
        .select("challenge_id")
        .eq("user_id", userId)
        .in("challenge_id", requiredIds);

      const completedIds = new Set((userCompleted || []).map((uc: any) => uc.challenge_id));
      const allDone =
        requiredIds.length > 0 &&
        completedIds.size >= (badge.required_challenges_count || requiredIds.length);

      if (!allDone) continue;

      if (badge.is_final) {
        const { data: allBadges } = await supabase
          .from("badges")
          .select("id")
          .eq("is_final", false);

        const { data: ownedBadges } = await supabase
          .from("user_badges")
          .select("badge_id")
          .eq("user_id", userId);

        const ownedSet = new Set(
          (ownedBadges || []).map((ub: any) => ub.badge_id)
        );
        badgesUnlocked.forEach((name) => {
          const found = badgeIds.find((id) => id !== badgeId);
          if (found) ownedSet.add(found);
        });

        const allNonFinal = (allBadges || []).map((b: any) => b.id);
        const hasAllOthers = allNonFinal.every((id: string) => ownedSet.has(id));

        if (!hasAllOthers) continue;
      }

      const { error: badgeErr } = await supabase
        .from("user_badges")
        .insert([{ user_id: userId, badge_id: badgeId }]);

      if (!badgeErr) {
        badgesUnlocked.push(badge.name);
      }
    }

    const { data: currentLevel } = await supabase
      .from("levels")
      .select("*")
      .eq("id", progress.current_level_id)
      .single();

    const { data: allLevels } = await supabase
      .from("levels")
      .select("*")
      .order("level_number", { ascending: true });

    let newLevel = currentLevel;
    for (const level of allLevels || []) {
      if (newTotalXp >= level.xp_required) {
        newLevel = level;
      }
    }

    let levelUp = null;
    if (newLevel && currentLevel && newLevel.level_number > currentLevel.level_number) {
      levelUp = {
        from: currentLevel.name,
        to: newLevel.name,
        unlock: newLevel.unlock_description,
      };

      const isRoiGourmet = newLevel.level_number === 8;

      await supabase
        .from("user_progress")
        .update({
          current_level_id: newLevel.id,
          is_roi_gourmet: isRoiGourmet,
        })
        .eq("user_id", userId);
    }

    res.status(201).json({
      success: true,
      xp_gained: challenge.xp_reward,
      total_xp: newTotalXp,
      badges_unlocked: badgesUnlocked,
      level_up: levelUp,
      is_roi_gourmet: newLevel?.level_number === 8 && badgesUnlocked.includes("Roi Gourmet"),
    });
  } catch (error: any) {
    console.error("completeChallenge error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
