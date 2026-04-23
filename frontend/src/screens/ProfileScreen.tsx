import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Platform,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { LoginScreen } from "./LoginScreen";
import { ForgotPasswordScreen } from "./ForgotPasswordScreen";
import { ResetPasswordScreen } from "./ResetPasswordScreen";
import { RegisterScreen } from "./RegisterScreen";

type AuthView = "login" | "register" | "forgot" | "reset";

const LoggedOutView: React.FC<{
  authView: AuthView;
  setAuthView: (v: AuthView) => void;
  resetEmail: string;
  setResetEmail: (e: string) => void;
}> = ({ authView, setAuthView, resetEmail, setResetEmail }) => {
  if (authView === "register")
    return <RegisterScreen onGoToLogin={() => setAuthView("login")} />;

  if (authView === "forgot")
    return (
      <ForgotPasswordScreen
        onGoToLogin={() => setAuthView("login")}
        onGoToResetPassword={(email) => {
          setResetEmail(email);
          setAuthView("reset");
        }}
      />
    );

  if (authView === "reset")
    return (
      <ResetPasswordScreen
        initialEmail={resetEmail}
        onGoToLogin={() => setAuthView("login")}
      />
    );

  return (
    <LoginScreen
      onGoToRegister={() => setAuthView("register")}
      onGoToForgotPassword={() => setAuthView("forgot")}
    />
  );
};

const LoggedInView: React.FC = () => {
  const { user, logout } = useAuth();

  const performLogout = async () => {
    try {
      await logout();
    } catch {
      Alert.alert("Erreur", "Impossible de se déconnecter");
    }
  };

  const handleLogout = () => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      if (window.confirm("Êtes-vous sûr de vouloir vous déconnecter ?")) {
        performLogout();
      }
      return;
    }
    Alert.alert("Confirmation", "Êtes-vous sûr de vouloir vous déconnecter ?", [
      { text: "Annuler", style: "cancel" },
      { text: "Déconnexion", style: "destructive", onPress: performLogout },
    ]);
  };

  const fullName = user ? `${user.prenom} ${user.nom.toUpperCase()}` : "";

  // Données mock — à remplacer par de vraies données API
  const favoris = [{ id: "1", nom: "Fana", lieu: "Paris (18), France" }];
  const parcours = [
    { id: "1", nom: "Parcours mets et vins", lieu: "Paris, France" },
    { id: "2", nom: "Parcours végétarien", lieu: "Deauville, France" },
  ];

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.pageContent}>
      <Text style={styles.pageTitle}>Profil</Text>
      <View style={styles.profileHeader}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarInitials}>
            {user ? `${user.prenom[0]}${user.nom[0]}` : "?"}
          </Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{fullName}</Text>
          <Text style={styles.profileSub}>10 parcours complétés</Text>
          <View style={styles.badgeTag}>
            <Text style={styles.badgeTagText}>EXPLORATEUR</Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Mes badges</Text>
        <View style={styles.badgesRow}>
          <View style={styles.badgePlaceholder} />
          <View style={styles.badgePlaceholder} />
          <View style={styles.badgePlaceholder} />
        </View>
        <Text style={styles.badgesDesc}>
          Retrouves tous tes badges ici et découvre comment évoluer dans les
          niveaux !
        </Text>
        <TouchableOpacity style={styles.progressionButton}>
          <Text style={styles.progressionButtonText}>Voir ma progression</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mes favoris</Text>
          <TouchableOpacity>
            <Text style={styles.sectionLink}>Voir tous</Text>
          </TouchableOpacity>
        </View>
        {favoris.map((item) => (
          <View key={item.id} style={styles.listCard}>
            <View style={styles.listImagePlaceholder} />
            <View style={styles.listInfo}>
              <Text style={styles.listName}>{item.nom}</Text>
              <Text style={styles.listSub}>{item.lieu}</Text>
            </View>
            <TouchableOpacity style={styles.arrowButton}>
              <Text style={styles.arrowText}>›</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mes parcours complétés</Text>
          <TouchableOpacity>
            <Text style={styles.sectionLink}>Voir tous</Text>
          </TouchableOpacity>
        </View>
        {parcours.map((item) => (
          <View key={item.id} style={styles.listCard}>
            <View style={styles.listImagePlaceholder} />
            <View style={styles.listInfo}>
              <Text style={styles.listName}>{item.nom}</Text>
              <Text style={styles.listSub}>{item.lieu}</Text>
            </View>
            <TouchableOpacity style={styles.arrowButton}>
              <Text style={styles.arrowText}>›</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export const ProfileScreen: React.FC = () => {
  const { isSignedIn } = useAuth();
  const [authView, setAuthView] = useState<AuthView>("login");
  const [resetEmail, setResetEmail] = useState("");

  if (isSignedIn) {
    return <LoggedInView />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <LoggedOutView
        authView={authView}
        setAuthView={setAuthView}
        resetEmail={resetEmail}
        setResetEmail={setResetEmail}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#f0ede8",
  },
  pageContent: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#111",
    marginBottom: 20,
  },

  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    gap: 16,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#111",
    marginBottom: 4,
  },
  profileSub: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  badgeTag: {
    alignSelf: "flex-start",
    backgroundColor: "#555",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeTagText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 1,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#111",
    marginBottom: 16,
  },
  badgesRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  badgePlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#e0e0e0",
  },
  badgesDesc: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
    marginBottom: 16,
  },
  progressionButton: {
    backgroundColor: "#c0001a",
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: "center",
  },
  progressionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },

  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111",
  },
  sectionLink: {
    fontSize: 14,
    color: "#111",
    fontWeight: "500",
  },

  listCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginBottom: 10,
    gap: 12,
  },
  listImagePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#ddd",
  },
  listInfo: {
    flex: 1,
  },
  listName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111",
    marginBottom: 4,
  },
  listSub: {
    fontSize: 13,
    color: "#888",
  },
  arrowButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#111",
    alignItems: "center",
    justifyContent: "center",
  },
  arrowText: {
    fontSize: 18,
    color: "#111",
    lineHeight: 20,
  },

  logoutButton: {
    marginTop: 8,
    borderWidth: 1.5,
    borderColor: "#c0001a",
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: "center",
  },
  logoutText: {
    color: "#c0001a",
    fontSize: 15,
    fontWeight: "600",
  },
});
