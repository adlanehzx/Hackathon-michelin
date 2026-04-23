import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import gamificationService from "../services/gamificationService";
import { LoginScreen } from "./LoginScreen";
import { ForgotPasswordScreen } from "./ForgotPasswordScreen";
import { ResetPasswordScreen } from "./ResetPasswordScreen";
import { RegisterScreen } from "./RegisterScreen";

type AuthView = "login" | "register" | "forgot" | "reset";

const AuthFlowView: React.FC<{
  authView: AuthView;
  setAuthView: (v: AuthView) => void;
  resetEmail: string;
  setResetEmail: (e: string) => void;
  onBack: () => void;
}> = ({ authView, setAuthView, resetEmail, setResetEmail, onBack }) => {
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

const LoggedOutView: React.FC<{ onConnect: () => void }> = ({ onConnect }) => {
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.pageContent}>
      <Text style={styles.pageTitle}>Mon profil</Text>

      <TouchableOpacity style={styles.connectButton} onPress={onConnect}>
        <Text style={styles.connectButtonText}>Se connecter / S'inscrire</Text>
      </TouchableOpacity>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Aucun badge</Text>
        <View style={styles.badgesRow}>
          <View style={styles.badgePlaceholder} />
          <View style={styles.badgePlaceholder} />
          <View style={styles.badgePlaceholder} />
        </View>
        <Text style={styles.badgesDesc}>
          Retrouves tous tes badges ici et découvre comment évoluer dans les
          niveaux !
        </Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mes favoris</Text>
        </View>
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Aucun favoris pour le moment</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mes parcours complétés</Text>
        </View>
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Aucun parcours complété</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const LoggedInView: React.FC = () => {
  const { user, token, logout } = useAuth();
  const [progress, setProgress] = useState<any>(null);
  const [badges, setBadges] = useState<any[]>([]);
  const [challenges, setChallenges] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      const [prog, bdg, ch] = await Promise.all([
        gamificationService.getMyProgress(token),
        gamificationService.getMyBadges(token),
        gamificationService.getMyChallenges(token),
      ]);
      setProgress(prog);
      setBadges(bdg || []);
      setChallenges(ch);
    } catch (err) {
      console.error("Erreur chargement profil:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
  const levelName = progress?.current_level?.name || "Curieux";
  const hasBadges = badges.length > 0;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#c0001a" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.pageContent}>
      <Text style={styles.pageTitle}>Mon profil</Text>

      <View style={styles.profileHeader}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarInitials}>
            {user ? `${user.prenom[0]}${user.nom[0]}` : "?"}
          </Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{fullName}</Text>
          <Text style={styles.profileSub}>Aucun parcours complété</Text>
          <View style={styles.badgeTag}>
            <Text style={styles.badgeTagText}>{levelName.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          {hasBadges ? "Mes badges" : "Aucun badge"}
        </Text>
        <View style={styles.badgesRow}>
          {hasBadges ? (
            badges.slice(0, 3).map((b: any) => (
              <View key={b.id} style={styles.badgeEarned}>
                <Text style={styles.badgeEarnedText}>{b.name[0]}</Text>
              </View>
            ))
          ) : (
            <>
              <View style={styles.badgePlaceholder} />
              <View style={styles.badgePlaceholder} />
              <View style={styles.badgePlaceholder} />
            </>
          )}
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
        </View>
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Aucun favoris pour le moment</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mes parcours complétés</Text>
        </View>
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Aucun parcours complété</Text>
        </View>
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
  const [showAuth, setShowAuth] = useState(false);

  if (isSignedIn) {
    return <LoggedInView />;
  }

  if (showAuth) {
    return (
      <View style={{ flex: 1, backgroundColor: "#fff" }}>
        <AuthFlowView
          authView={authView}
          setAuthView={setAuthView}
          resetEmail={resetEmail}
          setResetEmail={setResetEmail}
          onBack={() => setShowAuth(false)}
        />
      </View>
    );
  }

  return <LoggedOutView onConnect={() => setShowAuth(true)} />;
};

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#F5F1EE",
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

  connectButton: {
    backgroundColor: "#c0001a",
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 24,
  },
  connectButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  emptyCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 14,
    color: "#888",
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: "#F5F1EE",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeEarned: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#c0001a",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeEarnedText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
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
