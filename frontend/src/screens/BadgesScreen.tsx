import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  ImageSourcePropType,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import gamificationService from "../services/gamificationService";
import { BackArrowIcon } from "../components/SvgIcons";

export const BADGE_IMAGES: Record<string, ImageSourcePropType> = {
  firework: require("../../assets/badges/firework.png"),
  medal: require("../../assets/badges/medal.png"),
  champagne: require("../../assets/badges/champagne.png"),
  achievement: require("../../assets/badges/achievement.png"),
  winner: require("../../assets/badges/winner.png"),
  milestone: require("../../assets/badges/milestone.png"),
  crown: require("../../assets/badges/crown.png"),
};

const BADGE_ICON_KEYS = Object.keys(BADGE_IMAGES);

export function getBadgeImage(index: number): ImageSourcePropType {
  return BADGE_IMAGES[BADGE_ICON_KEYS[index % BADGE_ICON_KEYS.length]];
}

interface BadgesScreenProps {
  onBack: () => void;
}

export const BadgesScreen: React.FC<BadgesScreenProps> = ({ onBack }) => {
  const { token } = useAuth();
  const [allBadges, setAllBadges] = useState<any[]>([]);
  const [earnedBadgeIds, setEarnedBadgeIds] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [badges, myProgress] = await Promise.all([
        gamificationService.getAllBadges(),
        token ? gamificationService.getMyProgress(token) : null,
      ]);

      setAllBadges(badges || []);
      setProgress(myProgress);

      if (token) {
        const myBadges = await gamificationService.getMyBadges(token);
        const ids = new Set<string>((myBadges || []).map((b: any) => b.id));
        setEarnedBadgeIds(ids);
      }
    } catch (err) {
      console.error("Erreur chargement badges:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const levelName = progress?.current_level?.name || "Curieux";
  const levelNumber = progress?.current_level?.level_number || 1;
  const totalXp = progress?.total_xp || 0;
  const nextLevelXp = progress?.next_level?.xp_required || 100;
  const currentLevelXp = progress?.current_level?.xp_required || 0;
  const xpRange = nextLevelXp - currentLevelXp;
  const xpProgress = xpRange > 0 ? (totalXp - currentLevelXp) / xpRange : 0;
  const progressPercent = Math.min(Math.max(xpProgress, 0), 1);

  const regularBadges = allBadges.filter((b: any) => !b.is_final);
  const finalBadge = allBadges.find((b: any) => b.is_final);

  const badgesByCategory = regularBadges.reduce<
    Record<string, { name: string; badges: any[] }>
  >((acc, badge, _index) => {
    const catId = badge.category?.id || "other";
    const catName = badge.category?.name || "Autres";
    if (!acc[catId]) {
      acc[catId] = { name: catName, badges: [] };
    }
    acc[catId].badges.push(badge);
    return acc;
  }, {});

  const categoryEntries = Object.entries(badgesByCategory);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#C0012C" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          activeOpacity={0.6}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <BackArrowIcon width={32} height={32} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Réussites et récompenses</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroSection}>
          <View style={styles.trophyCircle}>
            <Image
              source={BADGE_IMAGES.winner}
              style={styles.trophyImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.heroTitle}>Vos récompenses</Text>
          <Text style={styles.heroDescription}>
            Débloquez de nouvelles récompenses pour{"\n"}atteindre le niveau
            suivant
          </Text>
        </View>

        <View style={styles.progressSection}>
          <Text style={styles.levelText}>
            Niveau {levelNumber} – {levelName}
          </Text>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${progressPercent * 100}%` },
                ]}
              />
            </View>
            <View
              style={[
                styles.progressDot,
                {
                  left: `${Math.min(progressPercent * 100, 95)}%`,
                },
              ]}
            />
          </View>
          <Text style={styles.xpText}>
            {totalXp} / {nextLevelXp} points
          </Text>
        </View>

        {categoryEntries.map(([catId, { name: catName, badges }]) => (
          <View key={catId} style={styles.badgesSection}>
            <Text style={styles.sectionTitle}>{catName.toUpperCase()}</Text>
            <View style={styles.badgesGrid}>
              {badges.map((badge: any, index: number) => {
                const isEarned = earnedBadgeIds.has(badge.id);
                const globalIndex = allBadges.indexOf(badge);
                return (
                  <View key={badge.id} style={styles.badgeItem}>
                    <View
                      style={[
                        styles.badgeCircle,
                        isEarned
                          ? styles.badgeCircleEarned
                          : styles.badgeCircleLocked,
                      ]}
                    >
                      <Image
                        source={getBadgeImage(globalIndex >= 0 ? globalIndex : index)}
                        style={[
                          styles.badgeImage,
                          !isEarned && styles.badgeImageLocked,
                        ]}
                        resizeMode="contain"
                      />
                    </View>
                    <Text
                      style={[
                        styles.badgeName,
                        !isEarned && styles.badgeNameLocked,
                      ]}
                      numberOfLines={2}
                    >
                      {badge.name}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        ))}

        {finalBadge && (
          <View style={styles.finalBadgeSection}>
            <Text style={styles.sectionTitle}>BADGE ULTIME</Text>
            <View style={styles.finalBadgeCard}>
              <View
                style={[
                  styles.finalBadgeCircle,
                  earnedBadgeIds.has(finalBadge.id)
                    ? styles.badgeCircleEarned
                    : styles.badgeCircleLocked,
                ]}
              >
                <Image
                  source={BADGE_IMAGES.crown}
                  style={[
                    styles.finalBadgeImage,
                    !earnedBadgeIds.has(finalBadge.id) &&
                      styles.badgeImageLocked,
                  ]}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.finalBadgeInfo}>
                <Text style={styles.finalBadgeName}>{finalBadge.name}</Text>
                <Text style={styles.finalBadgeDesc}>
                  {finalBadge.description || "Obtenez tous les badges pour le débloquer"}
                </Text>
              </View>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F1EE",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#F5F1EE",
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0C0C0C",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },

  heroSection: {
    alignItems: "center",
    paddingVertical: 28,
  },
  trophyCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#0078C9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  trophyImage: {
    width: 52,
    height: 52,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0C0C0C",
    marginBottom: 8,
  },
  heroDescription: {
    fontSize: 15,
    color: "#6B6360",
    textAlign: "center",
    lineHeight: 22,
  },

  progressSection: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 28,
  },
  levelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0C0C0C",
    marginBottom: 12,
  },
  progressBarContainer: {
    position: "relative",
    height: 20,
    justifyContent: "center",
    marginBottom: 8,
  },
  progressBarTrack: {
    height: 10,
    backgroundColor: "#FED0DB",
    borderRadius: 5,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#C0012C",
    borderRadius: 5,
  },
  progressDot: {
    position: "absolute",
    top: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#C0012C",
    backgroundColor: "#fff",
    marginLeft: -8,
  },
  xpText: {
    fontSize: 13,
    color: "#A59F9A",
    textAlign: "right",
  },

  badgesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#A59F9A",
    letterSpacing: 1.5,
    marginBottom: 20,
  },
  badgesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    gap: 8,
  },
  badgeItem: {
    width: "30%",
    alignItems: "center",
    marginBottom: 16,
  },
  badgeCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    marginBottom: 8,
  },
  badgeCircleEarned: {
    backgroundColor: "#F0F8FF",
    borderColor: "#0078C9",
  },
  badgeCircleLocked: {
    backgroundColor: "#EDEDED",
    borderColor: "#D5D0CC",
  },
  badgeImage: {
    width: 42,
    height: 42,
  },
  badgeImageLocked: {
    opacity: 0.35,
  },
  badgeName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#3F362F",
    textAlign: "center",
    lineHeight: 16,
  },
  badgeNameLocked: {
    color: "#A59F9A",
  },

  finalBadgeSection: {
    marginBottom: 24,
  },
  finalBadgeCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  finalBadgeCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
  },
  finalBadgeImage: {
    width: 48,
    height: 48,
  },
  finalBadgeInfo: {
    flex: 1,
  },
  finalBadgeName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0C0C0C",
    marginBottom: 4,
  },
  finalBadgeDesc: {
    fontSize: 14,
    color: "#6B6360",
    lineHeight: 20,
  },
});
