import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
  Platform,
  TextInput,
} from "react-native";
import { restaurantService, Restaurant } from "../services/restaurantService";

const { width, height } = Dimensions.get("window");

// Conditional imports pour éviter les erreurs web
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

export const CarteScreen = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(
    null
  );
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [mapRef, setMapRef] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterMichelin, setFilterMichelin] = useState<number | null>(null);
  const [filterCuisine, setFilterCuisine] = useState("");

  useEffect(() => {
    loadRestaurants();
    getUserLocation();
  }, []);

  useEffect(() => {
    performSearch();
  }, [searchQuery, filterMichelin, filterCuisine, restaurants]);

  const performSearch = async () => {
    if (!searchQuery.trim()) {
      setFilteredRestaurants(restaurants);
      return;
    }

    try {
      const results = await restaurantService.searchRestaurants(
        searchQuery,
        filterCuisine || undefined,
        filterMichelin || undefined
      );
      setFilteredRestaurants(results);
    } catch (error) {
      console.error("Erreur recherche:", error);
    }
  };

  const getUserLocation = async () => {
    if (!Location || Platform.OS === "web") {
      console.log("Localisation non disponible sur web");
      return;
    }

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Permission de localisation refusée");
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (error) {
      console.error("Erreur localisation:", error);
    }
  };

  const loadRestaurants = async () => {
    try {
      setLoading(true);
      const data = await restaurantService.getAllRestaurants();
      setRestaurants(data);
    } catch (error) {
      console.error("Erreur:", error);
      Alert.alert("Erreur", "Impossible de charger les restaurants");
    } finally {
      setLoading(false);
    }
  };

  const fitToAllMarkers = () => {
    if (!mapRef || filteredRestaurants.length === 0) return;

    const coordinates = filteredRestaurants
      .filter((r) => r.lat && r.lng)
      .map((r) => ({
        latitude: r.lat!,
        longitude: r.lng!,
      }));

    if (coordinates.length === 0) return;

    mapRef.fitToCoordinates(coordinates, {
      edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
      animated: true,
    });
  };

  const renderMapView = () => {
    // Pour le web, afficher une vue alternative
    if (Platform.OS === "web") {
      return (
        <View style={styles.mapContainer}>
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapPlaceholderText}>
              📱 Carte disponible sur mobile
            </Text>
            <Text style={styles.mapSubtext}>
              {filteredRestaurants.length} restaurants trouvés
            </Text>
          </View>

          {selectedRestaurant && (
            <View style={styles.popup}>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setSelectedRestaurant(null)}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.popupTitle}>{selectedRestaurant.name}</Text>
              {selectedRestaurant.street && (
                <Text style={styles.popupText}>📍 {selectedRestaurant.street}</Text>
              )}
              {selectedRestaurant.city && (
                <Text style={styles.popupText}>
                  {selectedRestaurant.city}, {selectedRestaurant.country}
                </Text>
              )}
              {selectedRestaurant.phone && (
                <Text style={styles.popupText}>📞 {selectedRestaurant.phone}</Text>
              )}
              {selectedRestaurant.cuisine_type && (
                <Text style={styles.popupText}>
                  🍽️ {selectedRestaurant.cuisine_type}
                </Text>
              )}
            </View>
          )}
        </View>
      );
    }

    // Sur mobile: carte Google Maps
    const initialRegion = userLocation
      ? {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.5,
          longitudeDelta: 0.5,
        }
      : {
          latitude: 48.8566,
          longitude: 2.3522,
          latitudeDelta: 5,
          longitudeDelta: 5,
        };

    return (
      <View style={styles.mapContainer}>
        <MapView
          ref={setMapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={initialRegion}
        >
          {/* Marqueur de localisation de l'utilisateur */}
          {userLocation && (
            <Marker
              coordinate={{
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
              }}
              title="Ma position"
              description="Vous êtes ici"
              pinColor="#E4000F"
            />
          )}

          {/* Marqueurs des restaurants */}
          {filteredRestaurants
            .filter((restaurant) => restaurant.lat && restaurant.lng)
            .map((restaurant) => (
              <Marker
                key={restaurant.id}
                coordinate={{
                  latitude: restaurant.lat!,
                  longitude: restaurant.lng!,
                }}
                title={restaurant.name}
                description={restaurant.cuisine_type}
                onPress={() => setSelectedRestaurant(restaurant)}
                pinColor={
                  selectedRestaurant?.id === restaurant.id ? "#FFA500" : "#FF4444"
                }
              />
            ))}
        </MapView>

        {/* Bouton pour centrer sur tous les restaurants */}
        <TouchableOpacity
          style={styles.fitButton}
          onPress={fitToAllMarkers}
        >
          <Text style={styles.fitButtonText}>🎯 Tous</Text>
        </TouchableOpacity>

        {/* Popup du restaurant sélectionné */}
        {selectedRestaurant && (
          <View style={styles.popup}>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setSelectedRestaurant(null)}
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.popupTitle}>{selectedRestaurant.name}</Text>
            {selectedRestaurant.street && (
              <Text style={styles.popupText}>📍 {selectedRestaurant.street}</Text>
            )}
            {selectedRestaurant.city && (
              <Text style={styles.popupText}>
                {selectedRestaurant.city}, {selectedRestaurant.country}
              </Text>
            )}
            {selectedRestaurant.phone && (
              <Text style={styles.popupText}>📞 {selectedRestaurant.phone}</Text>
            )}
            {selectedRestaurant.cuisine_type && (
              <Text style={styles.popupText}>🍽️ {selectedRestaurant.cuisine_type}</Text>
            )}
            {selectedRestaurant.michelin_stars && (
              <Text style={styles.popupText}>
                ⭐ {selectedRestaurant.michelin_stars} étoiles
              </Text>
            )}
            {selectedRestaurant.chef && (
              <Text style={styles.popupText}>👨‍🍳 {selectedRestaurant.chef}</Text>
            )}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E4000F" />
        <Text style={styles.loadingText}>Chargement de la carte...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* En-tête */}
      {/* Barre de recherche */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Nom de restaurant, parcours..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Text style={styles.filterIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* Filtres */}
        {showFilters && (
          <View style={styles.filtersPanel}>
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Étoiles Michelin:</Text>
              <View style={styles.filterButtons}>
                {[0, 1, 2, 3].map((star) => (
                  <TouchableOpacity
                    key={star}
                    style={[
                      styles.starButton,
                      filterMichelin === star && styles.starButtonActive,
                    ]}
                    onPress={() =>
                      setFilterMichelin(filterMichelin === star ? null : star)
                    }
                  >
                    <Text style={styles.starButtonText}>
                      {star === 0 ? "Tous" : "⭐".repeat(star)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Cuisine:</Text>
              <TextInput
                style={styles.cuisineInput}
                placeholder="Ex: Gastronomie, Bio..."
                value={filterCuisine}
                onChangeText={setFilterCuisine}
                placeholderTextColor="#ccc"
              />
            </View>
          </View>
        )}
      </View>

      {/* Carte */}
      {renderMapView()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
  },
  subtitle: {
    fontSize: 14,
    color: "#999",
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: "#E4000F",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#999",
  },
  tabTextActive: {
    color: "#E4000F",
  },
  content: {
    flex: 1,
  },

  // Map View Styles
  mapContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  map: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  fitButton: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "#E4000F",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 5,
  },
  fitButtonText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
  },
  mapPlaceholder: {
    height: 300,
    backgroundColor: "#e8e8e8",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    margin: 12,
  },
  mapPlaceholderText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  mapSubtext: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },
  restaurantMarkers: {
    flex: 1,
    paddingHorizontal: 12,
  },
  markerButton: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    marginVertical: 4,
    borderRadius: 8,
    alignItems: "center",
  },
  marker: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  markerActive: {
    backgroundColor: "#E4000F",
  },
  markerText: {
    fontSize: 24,
  },
  markerInfo: {
    flex: 1,
  },
  markerTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
  },
  markerAddress: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  popup: {
    position: "absolute",
    bottom: 20,
    left: 12,
    right: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 5,
  },
  closeBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#666",
  },
  popupTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 8,
  },
  popupText: {
    fontSize: 13,
    color: "#666",
    marginVertical: 4,
  },

  // List View Styles
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  listItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    marginVertical: 8,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  listImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  listItemContent: {
    flex: 1,
    justifyContent: "space-between",
  },
  listTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#000",
  },
  listCuisine: {
    fontSize: 13,
    color: "#E4000F",
    fontWeight: "600",
    marginTop: 2,
  },
  listAddress: {
    fontSize: 12,
    color: "#999",
    marginVertical: 4,
  },
  listFooter: {
    flexDirection: "row",
    marginTop: 6,
  },
  listStars: {
    fontSize: 12,
    color: "#F59E0B",
    fontWeight: "600",
    marginRight: 12,
  },
  listPrice: {
    fontSize: 12,
    color: "#10B981",
    fontWeight: "600",
  },
  listChef: {
    fontSize: 11,
    color: "#666",
    fontWeight: "500",
    marginTop: 6,
    fontStyle: "italic",
  },

  // Search Bar Styles
  searchContainer: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 25,
    paddingHorizontal: 14,
    height: 44,
    marginBottom: 12,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#000",
    padding: 0,
  },
  filterButton: {
    padding: 8,
  },
  filterIcon: {
    fontSize: 18,
  },

  // Filters Panel Styles
  filtersPanel: {
    backgroundColor: "#fafafa",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  filterRow: {
    marginBottom: 14,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  filterButtons: {
    flexDirection: "row",
    gap: 8,
  },
  starButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  starButtonActive: {
    backgroundColor: "#E4000F",
    borderColor: "#E4000F",
  },
  starButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
  },
  cuisineInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#000",
  },
});
