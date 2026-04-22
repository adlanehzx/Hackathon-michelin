import React, { useState } from "react";
import { StatusBar } from "expo-status-bar";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
  Platform,
} from "react-native";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { RestaurationsScreen } from "./src/screens/RestaurationsScreen";
import { HotellerieScreen } from "./src/screens/HotellerieScreen";
import { CarteScreen } from "./src/screens/CarteScreen";
import { ParcoursScreen } from "./src/screens/ParcoursScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";

import RestaurantsIcon from "./assets/icons/Restaurants.png";
import HotellerieIcon from "./assets/icons/Hotellerie.png";
import CarteIcon from "./assets/icons/Carte.png";
import ParcoursIcon from "./assets/icons/Parcours.png";
import ProfileIcon from "./assets/icons/Profile.png";

type TabName = "restaurations" | "hotellerie" | "carte" | "parcours" | "profil";

const tabs: Array<{
  key: TabName;
  label: string;
  icon: any;
}> = [
  { key: "restaurations", label: "Resto", icon: RestaurantsIcon },
  { key: "hotellerie", label: "Hotels", icon: HotellerieIcon },
  { key: "carte", label: "Carte", icon: CarteIcon },
  { key: "parcours", label: "Parcours", icon: ParcoursIcon },
  { key: "profil", label: "Profil", icon: ProfileIcon },
];

const Navigation = () => {
  const { isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabName>("carte");

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.appContainer}>
      <View style={styles.screenContainer}>
        {activeTab === "restaurations" && <RestaurationsScreen />}
        {activeTab === "hotellerie" && <HotellerieScreen />}
        {activeTab === "carte" && <CarteScreen />}
        {activeTab === "parcours" && <ParcoursScreen />}
        {activeTab === "profil" && <ProfileScreen />}
      </View>

      <View style={styles.bottomNav}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;

          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.navButton, isActive && styles.navButtonActive]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.85}
            >
              <View style={styles.iconFrame}>
                <Image
                  source={tab.icon}
                  style={[styles.navIcon, isActive && styles.navIconActive]}
                />
              </View>
              <Text
                style={[styles.navLabel, isActive && styles.navLabelActive]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <StatusBar style="auto" />
    </View>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Navigation />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  screenContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  bottomNav: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderTopWidth: 1,
    borderTopColor: "#ececec",
    backgroundColor: "#fff",
    paddingTop: 8,
    paddingBottom: Platform.OS === "ios" ? 18 : 10,
    paddingHorizontal: 6,
    minHeight: 78,
  },
  navButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 6,
    borderTopWidth: 3,
    borderTopColor: "transparent",
  },
  navButtonActive: {
    borderTopColor: "#1a73e8",
  },
  iconFrame: {
    width: 28,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  navIcon: {
    width: 22,
    height: 22,
    resizeMode: "contain",
    opacity: 0.78,
  },
  navIconActive: {
    width: 24,
    height: 24,
    opacity: 1,
  },
  navLabel: {
    fontSize: 10,
    lineHeight: 12,
    color: "#707070",
    fontWeight: "600",
    textAlign: "center",
  },
  navLabelActive: {
    color: "#1a73e8",
  },
});
