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
  TextInput,
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

const FIGTREE_FONT = "Figtree-Medium";

const DEFAULT_FILTERS: ParcoursFilters = {
  mode: "parcours",
  countries: [],
  cities: [],
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

type FilterOptions = {
  countries: string[];
  cities: string[];
  establishmentTypes: string[];
  visitedPreference: string[];
  cuisines: string[];
  priceRanges: string[];
  distinctions: string[];
};

const DEFAULT_FILTER_OPTIONS: FilterOptions = {
  countries: [],
  cities: [],
  establishmentTypes: ["restaurant", "hotel"],
  visitedPreference: ["all", "visited", "new"],
  cuisines: [],
  priceRanges: [],
  distinctions: [],
};

const VISITED_LABELS: Record<string, string> = {
  all: "Tous",
  visited: "Deja visites",
  new: "Nouveaux",
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
  const [applyingFilters, setApplyingFilters] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [filters, setFilters] = useState<ParcoursFilters>(DEFAULT_FILTERS);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>(DEFAULT_FILTER_OPTIONS);
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

  useEffect(() => {
    const loadFilterOptions = async () => {
      const options = await parcoursService.getFilterOptions();
      setFilterOptions({
        countries: options.countries,
        cities: options.cities,
        establishmentTypes:
          options.establishmentTypes.length > 0
            ? options.establishmentTypes
            : DEFAULT_FILTER_OPTIONS.establishmentTypes,
        visitedPreference:
          options.visitedPreference.length > 0
            ? options.visitedPreference
            : DEFAULT_FILTER_OPTIONS.visitedPreference,
        cuisines: options.cuisines,
        priceRanges: options.priceRanges,
        distinctions: options.distinctions,
      });
    };

    loadFilterOptions();
  }, []);

  const toggleArrayFilter = (
    key:
      | "countries"
      | "cities"
      | "establishmentTypes"
      | "cuisines"
      | "distinctions"
      | "priceRanges",
    value: string
  ) => {
    setFilters((prev) => {
      const current = prev[key] || [];
      const exists = current.includes(value);

      return {
        ...prev,
        [key]: exists ? current.filter((entry) => entry !== value) : [...current, value],
      };
    });
  };

  const loadParcours = useCallback(async (nextFilters?: ParcoursFilters, skipExisting = false) => {
    const effectiveFilters: ParcoursFilters =
      nextFilters || {
        ...DEFAULT_FILTERS,
        userLatitude: filters.userLatitude,
        userLongitude: filters.userLongitude,
      };

    setLoading(true);
    try {
      if (user?.id && !skipExisting) {
        const existing = await parcoursService.getUserParcours(user.id);
        if (existing) {
          setData(existing);
          setLoading(false);
          return;
        }
      }

      const suggestion = await parcoursService.getSuggestions({
        ...effectiveFilters,
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

  const applyFilters = async () => {
    setApplyingFilters(true);
    await loadParcours(filters, true);
    setApplyingFilters(false);
    setShowFilters(false);
  };

  const resetFilters = async () => {
    const nextFilters: ParcoursFilters = {
      ...DEFAULT_FILTERS,
      userLatitude: filters.userLatitude,
      userLongitude: filters.userLongitude,
    };

    setFilters(nextFilters);
    setApplyingFilters(true);
    await loadParcours(nextFilters, true);
    setApplyingFilters(false);
  };

  const createFilteredParcours = async () => {
    if (!user?.id) {
      Alert.alert("Parcours", "Connecte-toi pour creer et sauvegarder ton parcours.");
      return;
    }

    setApplyingFilters(true);
    try {
      const created = await parcoursService.createParcours({
        ...filters,
        userId: user.id,
      });

      if (created?.inProgress && created?.recommended) {
        setData(created);
        Alert.alert("Parcours", "Parcours filtre cree avec succes.");
      } else {
        Alert.alert("Parcours", "Impossible de creer le parcours avec ces filtres.");
      }
    } finally {
      setApplyingFilters(false);
    }
  };

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

  const renderFilterChip = (
    label: string,
    active: boolean,
    onPress: () => void
  ) => (
    <TouchableOpacity style={[styles.optionChip, active && styles.optionChipActive]} onPress={onPress}>
      <Text style={[styles.optionChipText, active && styles.optionChipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  const renderFiltersPanel = () => (
    <View style={styles.filtersWrap}>
      <TouchableOpacity style={styles.filtersToggle} onPress={() => setShowFilters((prev) => !prev)}>
        <Text style={styles.filtersToggleText}>
          {showFilters ? "Masquer les filtres" : "Afficher les filtres"}
        </Text>
      </TouchableOpacity>

      {!showFilters ? null : (
        <View style={styles.filtersPanel}>
          <Text style={styles.panelTitle}>Creation de parcours personnalise</Text>

      <Text style={styles.inputLabel}>Pays</Text>
      <View style={styles.optionRowStatic}>
        {(filterOptions.countries.length > 0 ? filterOptions.countries.slice(0, 8) : ["France"]).map(
          (country) =>
            renderFilterChip(
              country,
              (filters.countries || []).includes(country),
              () => toggleArrayFilter("countries", country)
            )
        )}
      </View>

      <Text style={styles.inputLabel}>Ville</Text>
      <View style={styles.optionRowStatic}>
        {(filterOptions.cities.length > 0 ? filterOptions.cities.slice(0, 10) : ["Paris"]).map((city) =>
          renderFilterChip(city, (filters.cities || []).includes(city), () =>
            toggleArrayFilter("cities", city)
          )
        )}
      </View>

      <Text style={styles.inputLabel}>Type d'etablissement</Text>
      <View style={styles.optionRowStatic}>
        {(filterOptions.establishmentTypes.length > 0
          ? filterOptions.establishmentTypes
          : ["restaurant", "hotel"]
        ).map((type) =>
          renderFilterChip(type, (filters.establishmentTypes || []).includes(type), () =>
            toggleArrayFilter("establishmentTypes", type)
          )
        )}
      </View>

      <Text style={styles.inputLabel}>Cuisine</Text>
      <View style={styles.optionRowStatic}>
        {(filterOptions.cuisines.length > 0 ? filterOptions.cuisines.slice(0, 10) : ["francaise", "asiatique"]).map(
          (cuisine) =>
            renderFilterChip(cuisine, (filters.cuisines || []).includes(cuisine), () =>
              toggleArrayFilter("cuisines", cuisine)
            )
        )}
      </View>

      <View style={styles.inputGrid}>
        <View style={styles.inputGridItem}>
          <Text style={styles.inputLabel}>Distance max (km)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={String(filters.radiusKm || 10)}
            onChangeText={(value) =>
              setFilters((prev) => ({
                ...prev,
                radiusKm: Number.isFinite(Number(value)) ? Number(value) : 10,
              }))
            }
            placeholder="10"
            placeholderTextColor="#9A8F8F"
          />
        </View>
        <View style={[styles.inputGridItem, { marginRight: 0 }]}>
          <Text style={styles.inputLabel}>Ville/Pays (texte)</Text>
          <TextInput
            style={styles.input}
            value={filters.locationQuery || ""}
            onChangeText={(value) => setFilters((prev) => ({ ...prev, locationQuery: value }))}
            placeholder="Paris, France..."
            placeholderTextColor="#9A8F8F"
          />
        </View>
      </View>

      <Text style={styles.inputLabel}>Budget</Text>
      <View style={styles.optionRowStatic}>
        {(filterOptions.priceRanges.length > 0 ? filterOptions.priceRanges : ["€", "€€", "€€€"]).map((range) =>
          renderFilterChip(range, (filters.priceRanges || []).includes(range), () =>
            toggleArrayFilter("priceRanges", range)
          )
        )}
      </View>

      <Text style={styles.inputLabel}>Distinctions Michelin</Text>
      <View style={styles.optionRowStatic}>
        {(filterOptions.distinctions.length > 0 ? filterOptions.distinctions.slice(0, 8) : ["1", "2", "3", "bib gourmand"]).map(
          (distinction) =>
            renderFilterChip(
              distinction,
              (filters.distinctions || []).includes(distinction),
              () => toggleArrayFilter("distinctions", distinction)
            )
        )}
      </View>

      <Text style={styles.inputLabel}>Restaurants deja visites</Text>
      <View style={styles.optionRowStatic}>
        {filterOptions.visitedPreference.map((option) =>
          renderFilterChip(
            VISITED_LABELS[option] || option,
            filters.visitedPreference === option,
            () => setFilters((prev) => ({ ...prev, visitedPreference: option as "visited" | "new" | "all" }))
          )
        )}
      </View>

      <View style={styles.panelActions}>
        <TouchableOpacity style={styles.secondaryButton} onPress={resetFilters}>
          <Text style={styles.secondaryButtonText}>Reinitialiser</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryButton} onPress={applyFilters}>
          <Text style={styles.primaryButtonText}>
            {applyingFilters ? "Chargement..." : "Appliquer filtres"}
          </Text>
        </TouchableOpacity>
      </View>

          <View style={styles.saveWrap}>
            <TouchableOpacity style={styles.saveButton} onPress={createFilteredParcours}>
              <Text style={styles.saveButtonText}>Creer et sauvegarder ce parcours</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      </View>
  );

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
          {renderFiltersPanel()}
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
        {renderFiltersPanel()}

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
    fontSize: 13,
    fontFamily: FIGTREE_FONT,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 32,
  },
  pageTitle: {
    fontSize: 28,
    lineHeight: 33,
    fontWeight: "700",
    color: "#111111",
    marginBottom: 14,
    fontFamily: FIGTREE_FONT,
  },
  filterChipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
  },
  filtersWrap: {
    marginBottom: 20,
  },
  filtersToggle: {
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#D8D1D1",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
  },
  filtersToggleText: {
    color: "#514B4B",
    fontSize: 13,
    fontWeight: "700",
    fontFamily: FIGTREE_FONT,
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
    fontSize: 12,
    fontWeight: "600",
    fontFamily: FIGTREE_FONT,
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
    fontSize: 16,
    fontWeight: "700",
    color: "#191616",
    marginBottom: 10,
    fontFamily: FIGTREE_FONT,
  },
  inputLabel: {
    fontSize: 12,
    color: "#665D5D",
    marginBottom: 6,
    marginTop: 8,
    fontWeight: "600",
    fontFamily: FIGTREE_FONT,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E2DADA",
    borderRadius: 10,
    minHeight: 42,
    backgroundColor: "#FFF",
    paddingHorizontal: 12,
    color: "#231F1F",
    fontFamily: FIGTREE_FONT,
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
    fontSize: 12,
    fontFamily: FIGTREE_FONT,
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
    fontSize: 14,
    fontFamily: FIGTREE_FONT,
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
    fontSize: 14,
    fontFamily: FIGTREE_FONT,
  },
  section: {
    marginBottom: 18,
  },
  sectionTitleUpper: {
    fontSize: 22,
    lineHeight: 26,
    fontWeight: "700",
    color: "#141212",
    marginBottom: 4,
    fontFamily: FIGTREE_FONT,
  },
  sectionSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    color: "#201C1C",
    marginBottom: 10,
    fontFamily: FIGTREE_FONT,
  },
  completionText: {
    fontSize: 13,
    color: "#3B3535",
    marginBottom: 8,
    fontFamily: FIGTREE_FONT,
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
    fontFamily: FIGTREE_FONT,
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
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "700",
    fontFamily: FIGTREE_FONT,
  },
  cardPrice: {
    color: "#201C1C",
    fontSize: 14,
    marginHorizontal: 6,
    fontFamily: FIGTREE_FONT,
  },
  cardFavorite: {
    color: "#191515",
    fontSize: 18,
    lineHeight: 18,
    fontFamily: FIGTREE_FONT,
  },
  cardLocation: {
    color: "#595050",
    fontSize: 13,
    lineHeight: 16,
    marginTop: 4,
    marginBottom: 12,
    fontFamily: FIGTREE_FONT,
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
    fontSize: 14,
    fontWeight: "700",
    fontFamily: FIGTREE_FONT,
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
    fontSize: 14,
    fontFamily: FIGTREE_FONT,
  },
  recoHeader: {
    fontSize: 28,
    lineHeight: 33,
    fontWeight: "700",
    color: "#141212",
    marginBottom: 10,
    fontFamily: FIGTREE_FONT,
  },
});
