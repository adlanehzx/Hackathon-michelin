import React, { useState } from "react";
import { StatusBar } from "expo-status-bar";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { MapScreen } from "./src/screens/MapScreen";
import { FeedScreen } from "./src/screens/FeedScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";

type TabName = "map" | "feed" | "settings";

const Navigation = () => {
  const { isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabName>("map");

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
        {activeTab === "map" && <MapScreen />}
        {activeTab === "feed" && <FeedScreen />}
        {activeTab === "settings" && <SettingsScreen />}
      </View>

      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={[
            styles.navButton,
            activeTab === "map" && styles.navButtonActive,
          ]}
          onPress={() => setActiveTab("map")}
        >
          <Text
            style={[
              styles.navLabel,
              activeTab === "map" && styles.navLabelActive,
            ]}
          >
            📍 Carte
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.navButton,
            activeTab === "feed" && styles.navButtonActive,
          ]}
          onPress={() => setActiveTab("feed")}
        >
          <Text
            style={[
              styles.navLabel,
              activeTab === "feed" && styles.navLabelActive,
            ]}
          >
            📰 Flux
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.navButton,
            activeTab === "settings" && styles.navButtonActive,
          ]}
          onPress={() => setActiveTab("settings")}
        >
          <Text
            style={[
              styles.navLabel,
              activeTab === "settings" && styles.navLabelActive,
            ]}
          >
            ⚙️ Paramètres
          </Text>
        </TouchableOpacity>
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
  bottomNav: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    backgroundColor: "#fff",
    paddingBottom: 10,
  },
  navButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  navButtonActive: {
    borderTopWidth: 4,
    borderTopColor: "#1a73e8",
  },
  navLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  navLabelActive: {
    color: "#1a73e8",
    fontWeight: "bold",
  },
});
