import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import {
  ParcoursData,
  ParcoursFilters,
  ParcoursItem,
  ParcoursResponse,
  parcoursService,
} from "../services/parcoursService";

const DEFAULT_FILTERS: ParcoursFilters = {
  mode: "parcours",
  establishmentTypes: ["restaurant"],
  distinctions: [],
  occasions: [],
  weather: "both",
  cuisines: [],
  diets: [],
  priceRanges: [],
  locationQuery: "",
  radiusKm: 10,
  userLatitude: undefined,
  userLongitude: undefined,
  peopleCount: 2,
  dateChoiceType: "periode",
  services: [],
  visitedPreference: "all",
  chefSelection: "",
};

const ProgressBar = ({ value }: { value: number }) => (
  <View style={styles.progressTrack}>
    <View style={[styles.progressFill, { width: `${Math.max(0, Math.min(100, value))}%` }]} />
  </View>
);

const localFallbackParcours = (): ParcoursResponse => ({
  filters: { mode: "parcours" },
  inProgress: {
    id: "local-fallback-current",
    title: "Parcours bistrots français",
    subtitle: "7 adresses - 165 points à récolter",
    completionPercentage: 14,
    collectedPoints: 30,
    totalPoints: 165,
    addressesCount: 7,
    status: "in_progress",
    items: [
      {
        restaurantId: "mock-1",
        name: "Fana",
        city: "Paris (18)",
        country: "France",
        imageUrl:
          "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80",
        priceRange: "€€",
        isCompleted: true,
        reservationUrl: "https://guide.michelin.com",
        points: 30,
      },
      {
        restaurantId: "mock-2",
        name: "Baca'v",
        city: "Paris (5)",
        country: "France",
        imageUrl:
          "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80",
        priceRange: "€€",
        isCompleted: false,
        reservationUrl: "https://guide.michelin.com",
        points: 20,
      },
    ],
  },
  recommended: {
    id: "local-fallback-recommended",
    title: "Parcours asiatiques",
    subtitle: "5 adresses - 125 points à récolter",
    completionPercentage: 0,
    collectedPoints: 0,
    totalPoints: 125,
    addressesCount: 5,
    status: "recommended",
    items: [
      {
        restaurantId: "mock-3",
        name: "Kodawari Ramen",
        city: "Paris (6)",
        country: "France",
        imageUrl:
          "https://images.unsplash.com/photo-1557872943-16a5ac26437e?auto=format&fit=crop&w=1200&q=80",
        priceRange: "€",
        isCompleted: false,
        reservationUrl: "https://guide.michelin.com",
        points: 25,
      },
      {
        restaurantId: "mock-4",
        name: "La Table d'Eugene",
        city: "Paris (6)",
        country: "France",
        imageUrl:
          "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=80",
        priceRange: "€€€",
        isCompleted: false,
        reservationUrl: "https://guide.michelin.com",
        points: 25,
      },
    ],
  },
});

const RestaurantCard = ({
  item,
  onReserve,
  onComplete,
  isCurrent,
}: {
  item: ParcoursItem;
  onReserve: (restaurant: ParcoursItem) => void;
  onComplete: (restaurant: ParcoursItem) => void;
  isCurrent: boolean;
}) => (
  <View style={styles.card}>
    <View style={styles.imageWrap}>
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
      ) : (
        <View style={styles.imageFallback}>
          <Text style={styles.imageFallbackText}>Michelin</Text>
        </View>
      )}
    </View>

    <View style={styles.cardBody}>
      <View style={styles.cardTopRow}>
        <Text style={styles.brandIcon}>◎</Text>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.cardPrice}>{item.priceRange || "€€"}</Text>
        <Text style={styles.cardFavorite}>{item.isCompleted ? "◉" : "♡"}</Text>
      </View>

      <Text style={styles.cardLocation} numberOfLines={1}>
        {item.city}, {item.country}
      </Text>

      <TouchableOpacity
        style={[styles.actionButton, item.isCompleted && styles.actionButtonDone]}
        onPress={() => (item.isCompleted ? onComplete(item) : onReserve(item))}
      >
        <Text style={[styles.actionButtonText, item.isCompleted && styles.actionButtonTextDone]}>
          {item.isCompleted ? "Complété" : isCurrent ? "Réserver" : "Réserver"}
        </Text>
      </TouchableOpacity>
    </View>
  </View>
);

export const ParcoursScreen = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ParcoursFilters>(DEFAULT_FILTERS);
  const [data, setData] = useState<ParcoursResponse | null>(null);

  useEffect(() => {
    const getUserLocation = async () => {
      try {
        if (Platform.OS === "web") {
          if (!navigator.geolocation) {
            return;
          }

          navigator.geolocation.getCurrentPosition(
            (position) => {
              setFilters((prev) => ({
                ...prev,
                userLatitude: position.coords.latitude,
                userLongitude: position.coords.longitude,
              }));
            },
            () => undefined,
            { enableHighAccuracy: false, timeout: 6000 }
          );
          return;
        }

        const locationModule = require("expo-location");
        const { status } = await locationModule.requestForegroundPermissionsAsync();

        if (status !== "granted") {
          return;
        }

        const location = await locationModule.getCurrentPositionAsync({});
        setFilters((prev) => ({
          ...prev,
          userLatitude: location.coords.latitude,
          userLongitude: location.coords.longitude,
        }));
      } catch (error) {
        console.log("Localisation indisponible pour les filtres parcours", error);
      }
    };

    getUserLocation();
  }, []);

  const loadParcours = useCallback(async () => {
    setLoading(true);
    try {
      if (user?.id) {
        const existing = await parcoursService.getUserParcours(user.id);
        if (existing) {
          setData(existing);
          setLoading(false);
          return;
        }
      }

      const suggestion = await parcoursService.getSuggestions({
        ...DEFAULT_FILTERS,
        userLatitude: filters.userLatitude,
        userLongitude: filters.userLongitude,
        userId: user?.id,
      });

      if (suggestion?.inProgress && suggestion?.recommended) {
        setData(suggestion);
      } else {
        setData(localFallbackParcours());
      }
    } catch (error) {
      console.error("Erreur chargement parcours:", error);
      setData(localFallbackParcours());
    } finally {
      setLoading(false);
    }
  }, [filters.userLatitude, filters.userLongitude, user?.id]);

  useEffect(() => {
    loadParcours();
  }, [loadParcours]);

  const handleReserve = async (item: ParcoursItem) => {
    if (!item.reservationUrl) {
      Alert.alert("Réservation", "Lien de réservation indisponible.");
      return;
    }

    const supported = await Linking.canOpenURL(item.reservationUrl);
    if (!supported) {
      Alert.alert("Réservation", "Impossible d'ouvrir ce lien.");
      return;
    }

    await Linking.openURL(item.reservationUrl);
  };

  const markAsCompleted = async (item: ParcoursItem) => {
    if (!data?.inProgress?.id) {
      return;
    }

    const success = await parcoursService.completeStop(data.inProgress.id, item.restaurantId, user?.id);
    if (!success) {
      Alert.alert("Parcours", "Impossible de valider cette étape.");
      return;
    }

    await loadParcours();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#CC0B39" />
        <Text style={styles.loadingText}>Chargement des parcours...</Text>
      </SafeAreaView>
    );
  }

  const inProgress: ParcoursData | undefined = data?.inProgress;
  const recommended: ParcoursData | undefined = data?.recommended;

  if (!inProgress || !recommended) {
    const fallback = localFallbackParcours();
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.pageTitle}>Parcours en cours</Text>
          <View style={styles.section}>
            <Text style={styles.sectionTitleUpper}>{fallback.inProgress.title.toUpperCase()}</Text>
            <Text style={styles.sectionSubtitle}>{fallback.inProgress.subtitle}</Text>
            <Text style={styles.completionText}>{fallback.inProgress.completionPercentage}% complété</Text>
            <ProgressBar value={fallback.inProgress.completionPercentage} />
            <View style={styles.cardsGrid}>
              {fallback.inProgress.items.map((item) => (
                <RestaurantCard
                  key={`${fallback.inProgress.id}-${item.restaurantId}`}
                  item={item}
                  onReserve={handleReserve}
                  onComplete={markAsCompleted}
                  isCurrent={true}
                />
              ))}
            </View>
          </View>
          <View style={styles.section}>
            <Text style={styles.recoHeader}>Parcours recommandé</Text>
            <Text style={styles.sectionTitleUpper}>{fallback.recommended.title.toUpperCase()}</Text>
            <Text style={styles.sectionSubtitle}>{fallback.recommended.subtitle}</Text>
            <Text style={styles.completionText}>{fallback.recommended.completionPercentage}% complété</Text>
            <ProgressBar value={fallback.recommended.completionPercentage} />
            <View style={styles.cardsGrid}>
              {fallback.recommended.items.map((item) => (
                <RestaurantCard
                  key={`${fallback.recommended.id}-${item.restaurantId}`}
                  item={item}
                  onReserve={handleReserve}
                  onComplete={markAsCompleted}
                  isCurrent={false}
                />
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Parcours en cours</Text>

        {inProgress && (
          <View style={styles.section}>
            <Text style={styles.sectionTitleUpper}>{inProgress.title.toUpperCase()}</Text>
            <Text style={styles.sectionSubtitle}>{inProgress.subtitle}</Text>
            <Text style={styles.completionText}>{inProgress.completionPercentage}% complété</Text>
            <ProgressBar value={inProgress.completionPercentage} />

            <View style={styles.cardsGrid}>
              {inProgress.items.map((item) => (
                <RestaurantCard
                  key={`${inProgress.id}-${item.restaurantId}`}
                  item={item}
                  onReserve={handleReserve}
                  onComplete={markAsCompleted}
                  isCurrent={true}
                />
              ))}
            </View>
          </View>
        )}

        {recommended && (
          <View style={styles.section}>
            <Text style={styles.recoHeader}>Parcours recommandé</Text>
            <Text style={styles.sectionTitleUpper}>{recommended.title.toUpperCase()}</Text>
            <Text style={styles.sectionSubtitle}>{recommended.subtitle}</Text>
            <Text style={styles.completionText}>{recommended.completionPercentage}% complété</Text>
            <ProgressBar value={recommended.completionPercentage} />

            <View style={styles.cardsGrid}>
              {recommended.items.map((item) => (
                <RestaurantCard
                  key={`${recommended.id}-${item.restaurantId}`}
                  item={item}
                  onReserve={handleReserve}
                  onComplete={markAsCompleted}
                  isCurrent={false}
                />
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F1F1",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F4F1F1",
  },
  loadingText: {
    marginTop: 10,
    color: "#6B6363",
    fontSize: 11,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 32,
  },
  pageTitle: {
    fontSize: 41,
    lineHeight: 43,
    fontWeight: "700",
    color: "#111111",
    marginBottom: 14,
    letterSpacing: -1.2,
  },
  filterChipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#D9D3D3",
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: "#FFFFFF",
  },
  chipActive: {
    borderColor: "#CC0B39",
    backgroundColor: "#FFF3F5",
  },
  chipText: {
    color: "#514B4B",
    fontSize: 9,
    fontWeight: "600",
  },
  chipTextActive: {
    color: "#CC0B39",
  },
  filtersPanel: {
    marginBottom: 20,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderWidth: 1,
    borderColor: "#E8E1E1",
  },
  panelTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#191616",
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 9,
    color: "#665D5D",
    marginBottom: 6,
    marginTop: 8,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#E2DADA",
    borderRadius: 10,
    minHeight: 42,
    backgroundColor: "#FFF",
    paddingHorizontal: 12,
    color: "#231F1F",
  },
  inputGrid: {
    flexDirection: "row",
    marginTop: 2,
  },
  inputGridItem: {
    flex: 1,
    marginRight: 8,
  },
  optionRow: {
    paddingVertical: 4,
  },
  optionRowStatic: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
  },
  optionChip: {
    borderRadius: 999,
    backgroundColor: "#F6F2F2",
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginRight: 8,
    marginBottom: 8,
  },
  optionChipActive: {
    backgroundColor: "#CC0B39",
  },
  optionChipText: {
    color: "#585252",
    fontWeight: "600",
    fontSize: 9,
  },
  optionChipTextActive: {
    color: "#FFF",
  },
  panelActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#D5CDCD",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  secondaryButtonText: {
    color: "#554E4E",
    fontWeight: "700",
    fontSize: 9,
  },
  primaryButton: {
    backgroundColor: "#CC0B39",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  primaryButtonText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 9,
  },
  section: {
    marginBottom: 18,
  },
  sectionTitleUpper: {
    fontSize: 33,
    lineHeight: 35,
    fontWeight: "700",
    color: "#141212",
    marginBottom: 4,
    letterSpacing: -0.9,
  },
  sectionSubtitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
    color: "#201C1C",
    marginBottom: 10,
  },
  completionText: {
    fontSize: 13,
    color: "#3B3535",
    marginBottom: 8,
  },
  progressTrack: {
    width: "100%",
    height: 13,
    backgroundColor: "#F7CAD7",
    borderRadius: 999,
    overflow: "hidden",
    marginBottom: 14,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#E95A87",
    borderRadius: 999,
  },
  cardsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "48.4%",
    borderRadius: 18,
    backgroundColor: "#FFF",
    overflow: "hidden",
    marginBottom: 12,
  },
  imageWrap: {
    width: "100%",
    height: 170,
    backgroundColor: "#ECE4DF",
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  imageFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  imageFallbackText: {
    color: "#87756F",
    fontWeight: "700",
  },
  cardBody: {
    padding: 10,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  brandIcon: {
    color: "#CC0B39",
    fontSize: 13,
    marginRight: 6,
  },
  cardTitle: {
    flex: 1,
    color: "#221F1F",
    fontSize: 13,
    lineHeight: 15,
    fontWeight: "700",
  },
  cardPrice: {
    color: "#201C1C",
    fontSize: 14,
    marginHorizontal: 6,
  },
  cardFavorite: {
    color: "#191515",
    fontSize: 18,
    lineHeight: 18,
  },
  cardLocation: {
    color: "#595050",
    fontSize: 13,
    lineHeight: 16,
    marginTop: 4,
    marginBottom: 12,
  },
  actionButton: {
    minHeight: 48,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "#CC0B39",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF",
  },
  actionButtonDone: {
    backgroundColor: "#CC0B39",
  },
  actionButtonText: {
    color: "#CC0B39",
    fontSize: 13,
    fontWeight: "700",
  },
  actionButtonTextDone: {
    color: "#FFF",
  },
  saveWrap: {
    marginBottom: 18,
  },
  saveButton: {
    borderRadius: 14,
    backgroundColor: "#1E1A1A",
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 10,
  },
  recoHeader: {
    fontSize: 41,
    lineHeight: 43,
    fontWeight: "700",
    color: "#141212",
    marginBottom: 10,
    letterSpacing: -1.2,
  },
});
