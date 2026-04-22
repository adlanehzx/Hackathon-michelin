import React from "react";
import { View, Text, StyleSheet } from "react-native";

export const FeedScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Flux</Text>
      <Text style={styles.subtitle}>Fonctionnalité à venir</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
});
