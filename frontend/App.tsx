import React, { useState } from "react";
import { StatusBar } from "expo-status-bar";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
} from "react-native";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { RestaurationsScreen } from "./src/screens/RestaurationsScreen";
import { HotellerieScreen } from "./src/screens/HotellerieScreen";
import { CarteScreen } from "./src/screens/CarteScreen";
import { ParcoursScreen } from "./src/screens/ParcoursScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import FeedScreen from "./src/screens/FeedScreen";

// Import des icons
import RestaurantsIcon from "./assets/icons/Restaurants.png";
import HotellerieIcon from "./assets/icons/Hotellerie.png";
import CarteIcon from "./assets/icons/Carte.png";
import ParcoursIcon from "./assets/icons/Parcours.png";
import ProfileIcon from "./assets/icons/Profile.png";

type TabName = "restaurations" | "hotellerie" | "carte" | "parcours" | "profil" | "feed";

const Navigation = () => {
  const { isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabName>("carte");

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        {activeTab === "restaurations" && <RestaurationsScreen onOpenFeed={() => setActiveTab("feed")} />}
        {activeTab === "hotellerie" && <HotellerieScreen />}
        {activeTab === "carte" && <CarteScreen />}
        {activeTab === "parcours" && <ParcoursScreen />}
        {activeTab === "profil" && <ProfileScreen />}
        {activeTab === "feed" && <FeedScreen onBack={() => setActiveTab("restaurations")} />}
      </View>

      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={[
            styles.navButton,
            activeTab === "restaurations" && styles.navButtonActive,
          ]}
          onPress={() => setActiveTab("restaurations")}
        >
          <Image source={RestaurantsIcon} style={styles.navIcon} />
          <Text
            style={[
              styles.navLabel,
              activeTab === "restaurations" && styles.navLabelActive,
            ]}
          >
            Restaurations
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.navButton,
            activeTab === "hotellerie" && styles.navButtonActive,
          ]}
          onPress={() => setActiveTab("hotellerie")}
        >
          <Image source={HotellerieIcon} style={styles.navIcon} />
          <Text
            style={[
              styles.navLabel,
              activeTab === "hotellerie" && styles.navLabelActive,
            ]}
          >
            Hotellerie
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.navButton,
            activeTab === "carte" && styles.navButtonActive,
          ]}
          onPress={() => setActiveTab("carte")}
        >
          <Image source={CarteIcon} style={styles.navIcon} />
          <Text
            style={[
              styles.navLabel,
              activeTab === "carte" && styles.navLabelActive,
            ]}
          >
            Carte
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.navButton,
            activeTab === "parcours" && styles.navButtonActive,
          ]}
          onPress={() => setActiveTab("parcours")}
        >
          <Image source={ParcoursIcon} style={styles.navIcon} />
          <Text
            style={[
              styles.navLabel,
              activeTab === "parcours" && styles.navLabelActive,
            ]}
          >
            Parcours
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.navButton,
            activeTab === "profil" && styles.navButtonActive,
          ]}
          onPress={() => setActiveTab("profil")}
        >
          <Image source={ProfileIcon} style={styles.navIcon} />
          <Text
            style={[
              styles.navLabel,
              activeTab === "profil" && styles.navLabelActive,
            ]}
          >
            Profil
          </Text>
        </TouchableOpacity>
      </View>

      <StatusBar style="auto" />
    </View>
  );
};

export default function App() {
  console.log("App rendering");
  return (
    <AuthProvider>
      <Navigation />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    backgroundColor: "#fff",
    paddingBottom: 8,
  },
  navButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  navButtonActive: {
    borderTopWidth: 4,
    borderTopColor: "#1a73e8",
  },
  navIcon: {
    width: 28,
    height: 28,
    resizeMode: "contain",
  },
  navLabel: {
    fontSize: 11,
    color: "#666",
    fontWeight: "500",
    textAlign: "center",
  },
  navLabelActive: {
    color: "#1a73e8",
    fontWeight: "bold",
  },
});
