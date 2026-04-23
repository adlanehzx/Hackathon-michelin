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

type MichelinFilter = "all" | "selected" | "bib" | "star";

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const matchesMichelinFilter = (
  restaurant: Restaurant,
  filter: MichelinFilter,
) => {
  const award = normalizeText(restaurant.michelin_award || "");

  switch (filter) {
    case "selected":
      return award === "selected";
    case "bib":
      return restaurant.is_bib_gourmand || award.includes("bib");
    case "star":
      return (restaurant.michelin_stars ?? 0) > 0 || award.includes("star");
    default:
      return true;
  }
};

const getDistinctionLabel = (restaurant: Restaurant) => {
  if ((restaurant.michelin_stars ?? 0) > 0) {
    return `${restaurant.michelin_stars} etoile${restaurant.michelin_stars > 1 ? "s" : ""}`;
  }

  if (restaurant.is_bib_gourmand) {
    return "Bib Gourmand";
  }

  if ((restaurant.michelin_award || "").toLowerCase() === "selected") {
    return "Selection Michelin";
  }

  return "Restaurant";
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

  useEffect(() => {
    const loadRestaurants = async () => {
      try {
        setLoading(true);
        const data = await restaurantService.getAllRestaurants();
        setRestaurants(data.filter((restaurant) => restaurant.lat && restaurant.lng));
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
        matchesMichelinFilter(restaurant, filterMichelin)
      );
    });
  }, [restaurants, searchQuery, filterCuisine, filterMichelin]);

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
          <Text style={styles.searchIconText}>🔍</Text>
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
            <Text style={styles.filterBtnIcon}>⊞</Text>
          </TouchableOpacity>
        </View>

        {showFilters && (
          <View style={styles.filtersPanel}>
            <Text style={styles.filterSectionTitle}>Distinction Michelin</Text>
            <View style={styles.filterChips}>
              {[
                { key: "all", label: "Tous" },
                { key: "selected", label: "Sélectionnés" },
                { key: "bib", label: "Bib Gourmand" },
                { key: "star", label: "Étoilés" },
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

            <Text style={[styles.filterSectionTitle, { marginTop: 12 }]}>Type de cuisine</Text>
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
          <Text style={styles.mapPlaceholderText}>Map non disponible sur web</Text>
          <Text style={styles.mapSubtext}>La recherche et les filtres restent actifs.</Text>
        </View>

        <FlatList
          data={filteredRestaurants}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.card}>
              {item.image_url ? (
                <Image source={{ uri: item.image_url }} style={styles.cardImage} />
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
                  <Text style={styles.cardBadge}>{getDistinctionLabel(item)}</Text>
                </View>
                <Text style={styles.cardMeta} numberOfLines={1}>
                  {[item.city, item.country].filter(Boolean).join(", ") || "Localisation inconnue"}
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
    fontSize: 14,
    color: "#888",
    fontStyle: "italic",
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
    fontSize: 18,
    marginRight: 10,
    color: "#888",
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#1A1A1A",
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
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
    fontSize: 18,
    color: "#333",
  },
  filtersPanel: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
  },
  filterSectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#888",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 10,
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
    fontSize: 13,
    color: "#555",
    fontWeight: "600",
  },
  chipTextActive: {
    color: "#fff",
  },
  cuisineInput: {
    borderWidth: 1.5,
    borderColor: "#E0D8D0",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: "#1A1A1A",
    backgroundColor: "#FAFAFA",
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
    fontSize: 16,
    fontWeight: "700",
    color: "#555",
  },
  mapSubtext: {
    fontSize: 13,
    color: "#777",
    marginTop: 4,
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
    fontSize: 15,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  cardBadge: {
    fontSize: 10,
    fontWeight: "700",
    color: "#6A5C4D",
    backgroundColor: "#F3ECE4",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  cardMeta: {
    fontSize: 12,
    color: "#6A6A6A",
    marginTop: 6,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },
  emptyText: {
    fontSize: 13,
    color: "#777",
    marginTop: 4,
  },
});
