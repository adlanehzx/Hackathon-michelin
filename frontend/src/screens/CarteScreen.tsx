import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  Alert,
  Platform,
  TextInput,
} from "react-native";
import { restaurantService, Restaurant } from "../services/restaurantService";
import {
  RestaurantPin,
  getRestaurantPinKind,
} from "../components/RestaurantPin";

const { width, height } = Dimensions.get("window");

// Conditional imports to avoid web errors
let MapView: any = null;
let Marker: any = null;
let PROVIDER_GOOGLE: any = null;
let Location: any = null;

if (Platform.OS !== "web") {
  const maps = require("react-native-maps");
  MapView = maps.default;
  Marker = maps.Marker;
  PROVIDER_GOOGLE = maps.PROVIDER_GOOGLE;
  Location = require("expo-location");
}

type MichelinFilter = "all" | "selected" | "bib" | "star";

type MapRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

const DEFAULT_REGION: MapRegion = {
  latitude: 48.8566,
  longitude: 2.3522,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
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

const matchesSearch = (restaurant: Restaurant, query: string) => {
  if (!query) return true;

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

  return haystack.includes(query);
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

const getViewportRadiusKm = (region: MapRegion) =>
  Math.max(5, Math.min(35, region.latitudeDelta * 111 * 0.75));

const getViewportKey = (region: MapRegion) =>
  [
    region.latitude.toFixed(2),
    region.longitude.toFixed(2),
    Math.round(getViewportRadiusKm(region)),
  ].join(":");

// ─── Main Screen ─────────────────────────────────────────────────────────────
export const CarteScreen = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [selectedRestaurant, setSelectedRestaurant] =
    useState<Restaurant | null>(null);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [mapRef, setMapRef] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterMichelin, setFilterMichelin] = useState<MichelinFilter>("all");
  const [filterCuisine, setFilterCuisine] = useState("");
  const lastViewportKeyRef = useRef<string>("");
  const requestIdRef = useRef(0);

  useEffect(() => {
    initializeMapRestaurants();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, filterMichelin, filterCuisine, restaurants]);

  const initializeMapRestaurants = async () => {
    setLoading(true);

    try {
      const location = await getUserLocation();
      const region = location
        ? {
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.08,
            longitudeDelta: 0.08,
          }
        : DEFAULT_REGION;

      await loadRestaurantsForRegion(region, true);
    } catch (error) {
      console.error("Erreur initialisation carte:", error);
      Alert.alert("Erreur", "Impossible de charger les restaurants");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    const query = normalizeText(searchQuery);
    const cuisineQuery = normalizeText(filterCuisine);

    const results = restaurants.filter((restaurant) => {
      const cuisineValue = normalizeText(restaurant.cuisine_type || "");

      return (
        matchesSearch(restaurant, query) &&
        (!cuisineQuery || cuisineValue.includes(cuisineQuery)) &&
        matchesMichelinFilter(restaurant, filterMichelin)
      );
    });

    setFilteredRestaurants(results);
    if (
      selectedRestaurant &&
      !results.some((restaurant) => restaurant.id === selectedRestaurant.id)
    ) {
      setSelectedRestaurant(null);
    }
  };

  const getUserLocation = async () => {
    if (!Location || Platform.OS === "web") return null;
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return null;
      const location = await Location.getCurrentPositionAsync({});
      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setUserLocation(coords);
      return coords;
    } catch (error) {
      console.error("Erreur localisation:", error);
      return null;
    }
  };

  const loadRestaurantsForRegion = async (region: MapRegion, force = false) => {
    const viewportKey = getViewportKey(region);
    if (!force && lastViewportKeyRef.current === viewportKey) {
      return;
    }

    lastViewportKeyRef.current = viewportKey;
    const requestId = ++requestIdRef.current;

    try {
      const data = await restaurantService.getRestaurantsByLocation(
        region.latitude,
        region.longitude,
        getViewportRadiusKm(region),
      );

      if (requestId !== requestIdRef.current) {
        return;
      }

      setRestaurants(data);
    } catch (error) {
      console.error("Erreur:", error);
      Alert.alert("Erreur", "Impossible de charger les restaurants");
    }
  };

  const handleRegionChangeComplete = (region: MapRegion) => {
    void loadRestaurantsForRegion(region);
  };

  const fitToAllMarkers = () => {
    if (!mapRef || filteredRestaurants.length === 0) return;
    const coordinates = filteredRestaurants
      .filter((r) => r.lat && r.lng)
      .map((r) => ({ latitude: r.lat!, longitude: r.lng! }));
    if (coordinates.length === 0) return;
    mapRef.fitToCoordinates(coordinates, {
      edgePadding: { top: 120, right: 60, bottom: 220, left: 60 },
      animated: true,
    });
  };

  // ── NEW: Recenter on user location ────────────────────────────────────────
  const recenterOnUser = async () => {
    if (!mapRef || Platform.OS === "web") return;

    // If we already have the location, animate directly
    if (userLocation) {
      mapRef.animateToRegion(
        {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        },
        500,
      );
      return;
    }

    // Otherwise request it fresh
    if (!Location) return;
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Localisation refusée",
          "Autorisez la localisation dans les réglages pour utiliser cette fonctionnalité.",
        );
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setUserLocation(coords);
      mapRef.animateToRegion(
        { ...coords, latitudeDelta: 0.05, longitudeDelta: 0.05 },
        500,
      );
    } catch (error) {
      console.error("Erreur localisation:", error);
      Alert.alert("Erreur", "Impossible d'obtenir votre position.");
    }
  };

  // ── Popup card ─────────────────────────────────────────────────────────────
  const RestaurantPopup = () => {
    if (!selectedRestaurant) return null;
    return (
      <View style={styles.popup}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => setSelectedRestaurant(null)}
        >
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>

        <View style={styles.popupImageWrapper}>
          {selectedRestaurant.image_url ? (
            <Image
              source={{ uri: selectedRestaurant.image_url }}
              style={styles.popupImage}
            />
          ) : (
            <View style={styles.popupImageFallback}>
              <Text style={styles.popupImageFallbackIcon}>🍽️</Text>
            </View>
          )}
        </View>

        <View style={styles.popupHeader}>
          <Text style={styles.popupDistinction}>
            {getDistinctionLabel(selectedRestaurant)}
          </Text>
          {selectedRestaurant.michelin_stars ? (
            <View style={styles.starsRow}>
              {Array.from({ length: selectedRestaurant.michelin_stars }).map(
                (_, i) => (
                  <Text key={i} style={styles.starIcon}>
                    ⭐
                  </Text>
                ),
              )}
            </View>
          ) : null}
        </View>

        <Text style={styles.popupTitle}>{selectedRestaurant.name}</Text>

        {selectedRestaurant.cuisine_type && (
          <Text style={styles.popupCuisine}>
            {selectedRestaurant.cuisine_type}
          </Text>
        )}

        <View style={styles.popupMetaRow}>
          {selectedRestaurant.city ? (
            <Text style={styles.popupMetaPill}>{selectedRestaurant.city}</Text>
          ) : null}
          {formatPriceRange(selectedRestaurant.price_range) ? (
            <Text style={styles.popupMetaPill}>
              {formatPriceRange(selectedRestaurant.price_range)}
            </Text>
          ) : null}
        </View>

        <View style={styles.popupDivider} />

        {selectedRestaurant.chef && (
          <View style={styles.popupRow}>
            <Text style={styles.popupRowIcon}>👨‍🍳</Text>
            <Text style={styles.popupText}>{selectedRestaurant.chef}</Text>
          </View>
        )}
        {selectedRestaurant.street && (
          <View style={styles.popupRow}>
            <Text style={styles.popupRowIcon}>📍</Text>
            <Text style={styles.popupText}>
              {selectedRestaurant.street}
              {selectedRestaurant.city ? `, ${selectedRestaurant.city}` : ""}
            </Text>
          </View>
        )}
        {selectedRestaurant.phone && (
          <View style={styles.popupRow}>
            <Text style={styles.popupRowIcon}>📞</Text>
            <Text style={styles.popupText}>{selectedRestaurant.phone}</Text>
          </View>
        )}

        <TouchableOpacity style={styles.popupCta}>
          <Text style={styles.popupCtaText}>Voir la fiche</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // ── Map ────────────────────────────────────────────────────────────────────
  const renderMap = () => {
    if (Platform.OS === "web") {
      return (
        <View style={styles.mapContainer}>
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapPlaceholderIcon}>🗺️</Text>
            <Text style={styles.mapPlaceholderText}>
              Carte disponible sur mobile
            </Text>
            <Text style={styles.mapSubtext}>
              {filteredRestaurants.length} restaurants trouvés
            </Text>
          </View>
          <RestaurantPopup />
        </View>
      );
    }

    const initialRegion = userLocation
      ? {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }
      : DEFAULT_REGION;

    return (
      <View style={styles.mapContainer}>
        <MapView
          ref={setMapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={initialRegion}
          onRegionChangeComplete={handleRegionChangeComplete}
          customMapStyle={MICHELIN_MAP_STYLE}
        >
          {/* User location dot */}
          {userLocation && (
            <Marker
              coordinate={{
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
              }}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View style={styles.userDot}>
                <View style={styles.userDotInner} />
              </View>
            </Marker>
          )}

          {/* Restaurant markers */}
          {filteredRestaurants
            .filter((r) => r.lat && r.lng)
            .map((restaurant) => (
              <Marker
                key={restaurant.id}
                coordinate={{
                  latitude: restaurant.lat!,
                  longitude: restaurant.lng!,
                }}
                onPress={() => setSelectedRestaurant(restaurant)}
                anchor={{ x: 0.5, y: 1 }}
              >
                <RestaurantPin
                  kind={getRestaurantPinKind(restaurant)}
                  selected={selectedRestaurant?.id === restaurant.id}
                />
              </Marker>
            ))}
        </MapView>

        {/* ── Side action buttons ──────────────────────────────────────── */}
        <View style={styles.actionButtons}>
          {/* Fit all markers */}
          <TouchableOpacity style={styles.actionBtn} onPress={fitToAllMarkers}>
            <Text style={styles.actionBtnText}>⊙</Text>
          </TouchableOpacity>

          {/* Recenter on user location */}
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnLocate]}
            onPress={recenterOnUser}
          >
            <Text style={styles.actionBtnText}>◎</Text>
          </TouchableOpacity>
        </View>

        <RestaurantPopup />
      </View>
    );
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#C8102E" />
        <Text style={styles.loadingText}>Chargement de la carte…</Text>
      </View>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Search bar — floats above map */}
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

        {/* Filter panel */}
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

      {renderMap()}
    </View>
  );
};

// ─── Michelin-style muted map — clean beige/grey palette ─────────────────────
// Replaces the previous incomplete style that caused the green tint.
const MICHELIN_MAP_STYLE = [
  // Base geometry — warm light grey
  { elementType: "geometry", stylers: [{ color: "#ebe3d5" }] },

  // All labels
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#7b6f5e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#f5f0eb" }] },

  // Administrative boundaries
  {
    featureType: "administrative",
    elementType: "geometry.stroke",
    stylers: [{ color: "#c9b89a" }],
  },
  {
    featureType: "administrative.land_parcel",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },

  // Landscape — neutral sand
  {
    featureType: "landscape",
    elementType: "geometry",
    stylers: [{ color: "#ebe3d5" }],
  },
  {
    featureType: "landscape.natural",
    elementType: "geometry",
    stylers: [{ color: "#ddd6c8" }],
  },

  // POI — hide most points of interest to keep the map clean
  {
    featureType: "poi",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#d8e8c8", visibility: "on" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text",
    stylers: [{ visibility: "off" }],
  },

  // Roads
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#ffffff" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#e0d6c8" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9e8f7e" }],
  },
  {
    featureType: "road.arterial",
    elementType: "geometry",
    stylers: [{ color: "#f5ede0" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#f0d9a8" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#d9c48a" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#7a6540" }],
  },
  {
    featureType: "road.local",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },

  // Transit — hidden
  {
    featureType: "transit",
    stylers: [{ visibility: "off" }],
  },

  // Water — soft blue-grey
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#b8d4e0" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#7a9fb0" }],
  },
];

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F0EB",
  },

  // Loading
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

  // Search bar
  searchWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
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

  // Filters panel
  filtersPanel: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
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

  // Map
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
    width: "100%",
    height: "100%",
  },

  // User location dot
  userDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(66, 133, 244, 0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  userDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#4285F4",
    borderWidth: 2,
    borderColor: "#fff",
  },

  // ── Action buttons column (right side) ────────────────────────────────────
  actionButtons: {
    position: "absolute",
    top: Platform.OS === "ios" ? 130 : 90,
    right: 16,
    gap: 10,
    alignItems: "center",
  },
  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  actionBtnLocate: {
    // Slight red tint to differentiate the locate button
    borderWidth: 1.5,
    borderColor: "#C8102E",
  },
  actionBtnText: {
    fontSize: 22,
    color: "#C8102E",
  },

  // Web placeholder
  mapPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E8E4DF",
  },
  mapPlaceholderIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  mapPlaceholderText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#555",
  },
  mapSubtext: {
    fontSize: 13,
    color: "#999",
    marginTop: 4,
  },

  // Popup card
  popup: {
    position: "absolute",
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 10,
  },
  popupImageWrapper: {
    height: 132,
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 12,
    backgroundColor: "#EDE6DC",
  },
  popupImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  popupImageFallback: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  popupImageFallbackIcon: {
    fontSize: 30,
  },
  closeBtn: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#F5F0EB",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  closeBtnText: {
    fontSize: 14,
    color: "#888",
    fontWeight: "bold",
  },
  popupHeader: {
    marginBottom: 6,
    gap: 8,
  },
  popupDistinction: {
    alignSelf: "flex-start",
    backgroundColor: "#F3ECE4",
    color: "#6A5C4D",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  starsRow: {
    flexDirection: "row",
    gap: 2,
  },
  starIcon: {
    fontSize: 13,
  },
  popupTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1A1A1A",
    marginBottom: 4,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    paddingRight: 32,
  },
  popupCuisine: {
    fontSize: 13,
    color: "#C8102E",
    fontWeight: "600",
    marginBottom: 10,
  },
  popupMetaRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    marginBottom: 12,
  },
  popupMetaPill: {
    backgroundColor: "#F5F0EB",
    color: "#6B6056",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontSize: 11,
    fontWeight: "700",
  },
  popupDivider: {
    height: 1,
    backgroundColor: "#F0EAE3",
    marginBottom: 12,
  },
  popupRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
    gap: 8,
  },
  popupRowIcon: {
    fontSize: 14,
    width: 20,
  },
  popupText: {
    flex: 1,
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
  },
  popupCta: {
    marginTop: 14,
    backgroundColor: "#C8102E",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  popupCtaText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
    letterSpacing: 0.5,
  },
});
