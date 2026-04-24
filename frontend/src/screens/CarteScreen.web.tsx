import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  Alert,
  Platform,
} from "react-native";
import { restaurantService, Restaurant } from "../services/restaurantService";
import { AppIcon } from "../components/AppIcon";
import {
  getRestaurantPinKind,
  type RestaurantPinKind,
} from "../components/RestaurantPin";

const FIGTREE_FONT = "Figtree-Medium";

type MichelinFilter = "all" | "selected" | "bib" | "1star" | "2star" | "3star" | "green";

const ENABLE_TEMP_BALANCED_DISTINCTIONS = true;
const BALANCED_KIND_ORDER: RestaurantPinKind[] = ["selected", "bib", "star"];

const buildBalancedKindMap = (restaurants: Restaurant[]) => {
  const map: Record<string, RestaurantPinKind> = {};

  const sorted = [...restaurants].sort((a, b) => a.id.localeCompare(b.id));
  sorted.forEach((restaurant, index) => {
    map[restaurant.id] =
      BALANCED_KIND_ORDER[index % BALANCED_KIND_ORDER.length];
  });

  return map;
};

const getDisplayPinKind = (
  restaurant: Restaurant,
  balancedKindMap: Record<string, RestaurantPinKind>,
): RestaurantPinKind => {
  if (ENABLE_TEMP_BALANCED_DISTINCTIONS) {
    return balancedKindMap[restaurant.id] || "selected";
  }

  return getRestaurantPinKind(restaurant);
};

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const matchesMichelinFilter = (
  restaurant: Restaurant,
  filter: MichelinFilter,
  _balancedKindMap: Record<string, RestaurantPinKind>,
) => {
  const award = (restaurant.michelin_award || "").toUpperCase();
  const stars = restaurant.michelin_stars ?? 0;
  const isBib = restaurant.is_bib_gourmand || award.includes("BIB");
  const isGreen = restaurant.green_star === true;
  const hasStar = stars > 0 || award.includes("STAR");

  switch (filter) {
    case "selected":
      return !isBib && !hasStar && !isGreen;
    case "bib":
      return isBib;
    case "1star":
      return stars === 1 || award === "ONE_STAR";
    case "2star":
      return stars === 2 || award === "TWO_STARS";
    case "3star":
      return stars === 3 || award === "THREE_STARS";
    case "green":
      return isGreen;
    default:
      return true;
  }
};

const getDistinctionLabel = (
  restaurant: Restaurant,
  balancedKindMap: Record<string, RestaurantPinKind>,
) => {
  const displayKind = getDisplayPinKind(restaurant, balancedKindMap);

  if (displayKind === "star") {
    if ((restaurant.michelin_stars ?? 0) > 0) {
      return `${restaurant.michelin_stars} etoile${restaurant.michelin_stars > 1 ? "s" : ""}`;
    }

    return "Etoile Michelin";
  }

  if (displayKind === "bib") {
    return "Bib Gourmand";
  }

  return "Selection Michelin";
};

const getRealStarCount = (restaurant: Restaurant) => {
  if ((restaurant.michelin_stars ?? 0) > 0) {
    return restaurant.michelin_stars;
  }
  return 0;
};

const formatPriceRange = (priceRange?: string) => {
  if (!priceRange) return null;

  const mapping: Record<string, string> = {
    luxury: "Luxe",
    premium: "Premium",
    expensive: "Cher",
    moderate: "Modere",
    affordable: "Abordable",
  };

  return mapping[priceRange.toLowerCase()] || priceRange;
};

export const CarteScreen = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterMichelin, setFilterMichelin] = useState<MichelinFilter>("all");
  const [filterCuisine, setFilterCuisine] = useState("");

  const balancedKindMap = useMemo(
    () => buildBalancedKindMap(restaurants),
    [restaurants],
  );

  useEffect(() => {
    const loadRestaurants = async () => {
      try {
        setLoading(true);
        const data = await restaurantService.getAllRestaurants();
        setRestaurants(
          data.filter((restaurant) => restaurant.lat && restaurant.lng),
        );
      } catch (error) {
        console.error("Erreur:", error);
        Alert.alert("Erreur", "Impossible de charger les restaurants");
      } finally {
        setLoading(false);
      }
    };

    void loadRestaurants();
  }, []);

  const filteredRestaurants = useMemo(() => {
    const query = normalizeText(searchQuery);
    const cuisineQuery = normalizeText(filterCuisine);

    return restaurants.filter((restaurant) => {
      const haystack = normalizeText(
        [
          restaurant.name,
          restaurant.city,
          restaurant.country,
          restaurant.area,
          restaurant.street,
          restaurant.cuisine_type,
          restaurant.michelin_award,
          restaurant.slug,
          restaurant.chef,
        ]
          .filter(Boolean)
          .join(" "),
      );

      const cuisineValue = normalizeText(restaurant.cuisine_type || "");

      return (
        (!query || haystack.includes(query)) &&
        (!cuisineQuery || cuisineValue.includes(cuisineQuery)) &&
        matchesMichelinFilter(restaurant, filterMichelin, balancedKindMap)
      );
    });
  }, [
    restaurants,
    searchQuery,
    filterCuisine,
    filterMichelin,
    balancedKindMap,
  ]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#C8102E" />
        <Text style={styles.loadingText}>Chargement de la carte…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchWrapper}>
        <View style={styles.searchBar}>
          <View style={styles.searchIconText}>
            <AppIcon name="loupe" width={17} height={17} />
          </View>
          <TextInput
            style={styles.searchInput}
            placeholder="Nom, ville, cuisine ou pays…"
            placeholderTextColor="#AAAAAA"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          <TouchableOpacity
            style={[styles.filterBtn, showFilters && styles.filterBtnActive]}
            onPress={() => setShowFilters(!showFilters)}
          >
            <View style={styles.filterBtnIcon}>
              <AppIcon name="filtre" width={18} height={16} />
            </View>
          </TouchableOpacity>
        </View>

        {showFilters && (
          <View style={styles.filtersPanel}>
            <Text style={styles.filterSectionTitle}>Distinction Michelin</Text>
            <View style={styles.filterChips}>
              {[
                { key: "all", label: "Tous" },
                { key: "selected", label: "Sélections Michelin" },
                { key: "bib", label: "Bib Gourmand" },
                { key: "1star", label: "1 Étoile" },
                { key: "2star", label: "2 Étoiles" },
                { key: "3star", label: "3 Étoiles" },
                { key: "green", label: "Étoile Verte" },
              ].map((chip) => (
                <TouchableOpacity
                  key={chip.key}
                  style={[
                    styles.chip,
                    filterMichelin === chip.key && styles.chipActive,
                  ]}
                  onPress={() => setFilterMichelin(chip.key as MichelinFilter)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      filterMichelin === chip.key && styles.chipTextActive,
                    ]}
                  >
                    {chip.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.filterSectionTitle, { marginTop: 12 }]}>
              Type de cuisine
            </Text>
            <TextInput
              style={styles.cuisineInput}
              placeholder="Ex: Gastronomie, Japonais…"
              placeholderTextColor="#AAAAAA"
              value={filterCuisine}
              onChangeText={setFilterCuisine}
            />
          </View>
        )}
      </View>

      <View style={styles.contentArea}>
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapPlaceholderIcon}>🗺️</Text>
          <Text style={styles.mapPlaceholderText}>
            Map non disponible sur web
          </Text>
          <Text style={styles.mapSubtext}>
            La recherche et les filtres restent actifs.
          </Text>
        </View>

        <FlatList
          data={filteredRestaurants}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.card}>
              {item.image_url ? (
                <Image
                  source={{ uri: item.image_url }}
                  style={styles.cardImage}
                />
              ) : (
                <View style={styles.cardImagePlaceholder}>
                  <Text style={styles.cardImagePlaceholderIcon}>🍽️</Text>
                </View>
              )}
              <View style={styles.cardBody}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.cardBadge}>
                    {getDistinctionLabel(item, balancedKindMap)}
                  </Text>
                </View>
                {getRealStarCount(item) ? (
                  <Text style={styles.cardMeta}>
                    {"⭐".repeat(getRealStarCount(item))}
                  </Text>
                ) : null}
                <Text style={styles.cardMeta} numberOfLines={1}>
                  {[item.city, item.country].filter(Boolean).join(", ") ||
                    "Localisation inconnue"}
                </Text>
                {item.cuisine_type ? (
                  <Text style={styles.cardMeta} numberOfLines={1}>
                    {item.cuisine_type}
                    {formatPriceRange(item.price_range)
                      ? ` • ${formatPriceRange(item.price_range)}`
                      : ""}
                  </Text>
                ) : null}
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Aucun restaurant trouvé</Text>
              <Text style={styles.emptyText}>Essayez un autre filtre.</Text>
            </View>
          }
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F0EB",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F0EB",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: "#888",
    fontFamily: FIGTREE_FONT,
  },
  searchWrapper: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 56 : 16,
    paddingBottom: 8,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 30,
    paddingHorizontal: 16,
    height: 50,
  },
  searchIconText: {
    width: 17,
    height: 17,
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#1A1A1A",
    fontFamily: FIGTREE_FONT,
  },
  filterBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F5F0EB",
    justifyContent: "center",
    alignItems: "center",
  },
  filterBtnActive: {
    backgroundColor: "#C8102E",
  },
  filterBtnIcon: {
    width: 18,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  filtersPanel: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
  },
  filterSectionTitle: {
    fontSize: 11,
    color: "#888",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 10,
    fontFamily: FIGTREE_FONT,
  },
  filterChips: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#E0D8D0",
    backgroundColor: "#fff",
  },
  chipActive: {
    backgroundColor: "#C8102E",
    borderColor: "#C8102E",
  },
  chipText: {
    fontSize: 12,
    color: "#555",
    fontFamily: FIGTREE_FONT,
  },
  chipTextActive: {
    color: "#fff",
    fontFamily: FIGTREE_FONT,
  },
  cuisineInput: {
    borderWidth: 1.5,
    borderColor: "#E0D8D0",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: "#1A1A1A",
    backgroundColor: "#FAFAFA",
    fontFamily: FIGTREE_FONT,
  },
  contentArea: {
    flex: 1,
  },
  mapPlaceholder: {
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 10,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    backgroundColor: "#E8E4DF",
  },
  mapPlaceholderIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  mapPlaceholderText: {
    fontSize: 14,
    color: "#555",
    fontFamily: FIGTREE_FONT,
  },
  mapSubtext: {
    fontSize: 12,
    color: "#777",
    marginTop: 4,
    fontFamily: FIGTREE_FONT,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 28,
    gap: 10,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    overflow: "hidden",
  },
  cardImage: {
    width: 96,
    height: 96,
    resizeMode: "cover",
  },
  cardImagePlaceholder: {
    width: 96,
    height: 96,
    backgroundColor: "#EDE6DC",
    alignItems: "center",
    justifyContent: "center",
  },
  cardImagePlaceholderIcon: {
    fontSize: 26,
  },
  cardBody: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 14,
    color: "#1A1A1A",
    fontFamily: FIGTREE_FONT,
  },
  cardBadge: {
    fontSize: 11,
    color: "#6A5C4D",
    backgroundColor: "#F3ECE4",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    fontFamily: FIGTREE_FONT,
  },
  cardMeta: {
    fontSize: 11,
    color: "#6A6A6A",
    marginTop: 6,
    fontFamily: FIGTREE_FONT,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 20,
  },
  emptyTitle: {
    fontSize: 14,
    color: "#333",
    fontFamily: FIGTREE_FONT,
  },
  emptyText: {
    fontSize: 12,
    color: "#777",
    marginTop: 4,
    fontFamily: FIGTREE_FONT,
  },
});
