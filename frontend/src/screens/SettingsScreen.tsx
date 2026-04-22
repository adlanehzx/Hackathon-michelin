import React, { useState } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { useAuth } from "../context/AuthContext";
import { LoginScreen } from "./LoginScreen";
import { RegisterScreen } from "./RegisterScreen";
import { HomeScreen } from "./HomeScreen";

export const SettingsScreen: React.FC = () => {
  const { isSignedIn, logout } = useAuth();
  const [showRegister, setShowRegister] = useState(false);

  if (isSignedIn) {
    return (
      <View style={styles.container}>
        <HomeScreen />
        <View style={styles.logoutContainer}></View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { flex: 1 }]}>
      {showRegister ? (
        <RegisterScreen onGoToLogin={() => setShowRegister(false)} />
      ) : (
        <LoginScreen onGoToRegister={() => setShowRegister(true)} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  logoutContainer: {
    marginBottom: 20,
  },
});
