import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
} from "react-native";
import { restaurantService, Restaurant } from "../services/restaurantService";

export const RestaurationsScreen = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(
    null
  );

  useEffect(() => {
    loadRestaurants();
  }, []);

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

  const renderListItem = ({ item }: { item: Restaurant }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => setSelectedRestaurant(item)}
    >
      {item.image_url && (
        <Image source={{ uri: item.image_url }} style={styles.listImage} />
      )}
      <View style={styles.listItemContent}>
        <Text style={styles.listTitle}>{item.name}</Text>
        {item.cuisine_type && (
          <Text style={styles.listCuisine}>{item.cuisine_type}</Text>
        )}
        {item.street && (
          <Text style={styles.listAddress} numberOfLines={1}>
            📍 {item.street}
          </Text>
        )}
        <View style={styles.listFooter}>
          {item.michelin_stars && (
            <Text style={styles.listStars}>⭐ {item.michelin_stars}</Text>
          )}
          {item.price_range && (
            <Text style={styles.listPrice}>💶 {item.price_range}</Text>
          )}
        </View>
        {item.chef && (
          <Text style={styles.listChef}>👨‍🍳 {item.chef}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E4000F" />
        <Text style={styles.loadingText}>Chargement des restaurants...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* En-tête */}
      <View style={styles.header}>
        <Text style={styles.title}>Restaurations</Text>
        <Text style={styles.subtitle}>
          {restaurants.length} restaurants disponibles
        </Text>
      </View>

      {/* Liste */}
      <FlatList
        data={restaurants}
        renderItem={renderListItem}
        keyExtractor={(item) => item.id}
        style={styles.listContainer}
        contentContainerStyle={styles.listContent}
      />

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
});
