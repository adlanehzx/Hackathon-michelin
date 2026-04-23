import React, { useState } from "react";
import { StatusBar } from "expo-status-bar";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { RestaurationsScreen } from "./src/screens/RestaurationsScreen";
import { HotellerieScreen } from "./src/screens/HotellerieScreen";
import { CarteScreen } from "./src/screens/CarteScreen";
import { ParcoursScreen } from "./src/screens/ParcoursScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { NavIcon, type TabIconName } from "./src/components/NavIcon";

type TabName = "restaurations" | "hotellerie" | "carte" | "parcours" | "profil" | "feed";

const tabs: Array<{
  key: TabName;
  label: string;
  icon: TabIconName;
}> = [
  { key: "restaurations", label: "Resto", icon: "restaurations" },
  { key: "hotellerie", label: "Hotels", icon: "hotellerie" },
  { key: "carte", label: "Carte", icon: "carte" },
  { key: "parcours", label: "Parcours", icon: "parcours" },
  { key: "profil", label: "Profil", icon: "profil" },
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
        {activeTab === "feed" && <FeedScreen onBack={() => setActiveTab("restaurations")} />}
      </View>

      <View style={styles.bottomNav}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;

          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.navButton}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.85}
            >
              <View style={styles.iconFrame}>
                <NavIcon name={tab.icon} active={isActive} />
              </View>
              <Text style={styles.navLabel}>{tab.label}</Text>
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
  },
  iconFrame: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  navLabel: {
    fontSize: 10,
    lineHeight: 12,
    color: "#707070",
    fontWeight: "600",
    textAlign: "center",
  },
});
