import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from "react-native";
import { useAuth } from "../context/AuthContext";

const FIGTREE_FONT = "Figtree-Medium";

export const HomeScreen: React.FC = () => {
  const { user, logout } = useAuth();

  const performLogout = async () => {
    try {
      await logout();
    } catch (error) {
      Alert.alert("Erreur", "Impossible de se déconnecter");
    }
  };

  const handleLogout = async () => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      const confirmed = window.confirm(
        "Êtes-vous sûr de vouloir vous déconnecter?",
      );
      if (confirmed) {
        await performLogout();
      }
      return;
    }

    Alert.alert("Confirmation", "Êtes-vous sûr de vouloir vous déconnecter?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Déconnexion",
        style: "destructive",
        onPress: performLogout,
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bienvenue!</Text>
      <View style={styles.userCard}>
        <Text style={styles.label}>Nom:</Text>
        <Text style={styles.value}>
          {user ? `${user.nom} ${user.prenom}` : "Utilisateur non chargé"}
        </Text>

        <Text style={styles.label}>Email:</Text>
        <Text style={styles.value}>{user?.email || "Non renseigné"}</Text>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Se déconnecter</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 20,
    justifyContent: "flex-start",
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 24,
    color: "#000",
    fontFamily: FIGTREE_FONT,
  },
  userCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 8,
    marginBottom: 40,
  },
  label: {
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
    fontWeight: "600",
    fontFamily: FIGTREE_FONT,
  },
  value: {
    fontSize: 18,
    color: "#000",
    marginBottom: 24,
    fontWeight: "500",
    fontFamily: FIGTREE_FONT,
  },
  logoutButton: {
    width: "100%",
    backgroundColor: "#e74c3c",
    paddingVertical: 16,
    borderRadius: 6,
    alignItems: "center",
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: FIGTREE_FONT,
  },
});
