import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import gamificationService from "../services/gamificationService";
import { BackArrowIcon, CaretRightIcon } from "../components/SvgIcons";

interface SettingsScreenProps {
  onBack: () => void;
}

interface SettingRowProps {
  label: string;
  showDivider?: boolean;
  onPress?: () => void;
}

const SettingRow: React.FC<SettingRowProps> = ({
  label,
  showDivider = true,
  onPress,
}) => (
  <TouchableOpacity
    style={settingRowStyles.container}
    onPress={onPress}
    activeOpacity={0.6}
  >
    <View style={settingRowStyles.row}>
      <Text style={settingRowStyles.label}>{label}</Text>
      <CaretRightIcon />
    </View>
    {showDivider && <View style={settingRowStyles.divider} />}
  </TouchableOpacity>
);

const settingRowStyles = StyleSheet.create({
  container: {
    width: "100%",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    paddingVertical: 10,
  },
  label: {
    flex: 1,
    fontSize: 16,
    fontWeight: "400",
    color: "#0C0C0C",
    lineHeight: 19,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#E0DBD7",
    width: "100%",
  },
});

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({
  title,
  children,
}) => (
  <View style={sectionStyles.wrapper}>
    <Text style={sectionStyles.title}>{title}</Text>
    <View style={sectionStyles.card}>{children}</View>
  </View>
);

const sectionStyles = StyleSheet.create({
  wrapper: {
    gap: 19,
  },
  title: {
    fontSize: 24,
    fontWeight: "500",
    color: "#3F362F",
    lineHeight: 19,
  },
  card: {
    backgroundColor: "#FAFBFE",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FAFBFE",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
});

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack }) => {
  const { user, token, logout } = useAuth();
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const prog = await gamificationService.getMyProgress(token);
      setProgress(prog);
    } catch (err) {
      console.error("Erreur chargement progression:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fullName = user ? `${user.prenom} ${user.nom.toUpperCase()}` : "";
  const initials = user ? `${user.prenom[0]}${user.nom[0]}` : "?";
  const levelName = progress?.current_level?.name || "Curieux";

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
    Alert.alert(
      "Confirmation",
      "Êtes-vous sûr de vouloir vous déconnecter ?",
      [
        { text: "Annuler", style: "cancel" },
        { text: "Déconnexion", style: "destructive", onPress: performLogout },
      ]
    );
  };

  const handleDeleteAccount = () => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.alert("Cette fonctionnalité n'est pas encore disponible.");
      return;
    }
    Alert.alert(
      "Supprimer mon compte",
      "Cette fonctionnalité n'est pas encore disponible."
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#C0012C" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backButton}
          activeOpacity={0.6}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <BackArrowIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Paramètres</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <SettingsSection title="Profil et compte">
          <View style={styles.userCard}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{fullName}</Text>
              <View style={styles.badgeGradient}>
                <Text style={styles.badgeText}>
                  {levelName.toUpperCase()}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.editProfileRow}
                activeOpacity={0.6}
              >
                <Text style={styles.editProfileText}>Modifier mon profil</Text>
                <Text style={styles.editProfileIcon}>✎</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.rowsContainer}>
            <SettingRow label="Modifier mes informations" />
            <SettingRow label="Connexion et sécurité" />
            <SettingRow label="Confidentialité" showDivider={false} />
          </View>
        </SettingsSection>

        <SettingsSection title="Préférences et personnalisation">
          <SettingRow label="Customiser mon interface" />
          <SettingRow label="Mes préférences" />
          <SettingRow label="Label" showDivider={false} />
        </SettingsSection>

        <SettingsSection title="Aide et compréhension">
          <SettingRow label="Comprendre l'application" />
          <SettingRow label="Notre label Serein" />
          <SettingRow label="Centre d'aide" showDivider={false} />
        </SettingsSection>

        <SettingsSection title="Information et légal">
          <SettingRow label="À propos" />
          <SettingRow label="Partenaires et label" />
          <SettingRow
            label="Mentions légales et confidentialité"
            showDivider={false}
          />
        </SettingsSection>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Text style={styles.logoutText}>Me déconnecter</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDeleteAccount} activeOpacity={0.6}>
            <Text style={styles.deleteAccountText}>Supprimer mon compte</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: "#F5F1EE",
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    flex: 1,
    backgroundColor: "#F5F1EE",
  },
  header: {
    backgroundColor: "#F5F1EE",
    paddingTop: Platform.OS === "ios" ? 58 : 40,
    paddingBottom: 16,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    padding: 0,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "500",
    color: "#0C0C0C",
    lineHeight: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 40,
    gap: 28,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 18,
    paddingTop: 14,
    paddingBottom: 8,
  },
  avatarCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: "#A59F9A",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    fontSize: 30,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  userInfo: {
    flex: 1,
    gap: 12,
    paddingTop: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: "500",
    color: "#3F362F",
    lineHeight: 19,
  },
  badgeGradient: {
    alignSelf: "flex-start",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: "#C0012C",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "500",
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: 0,
  },
  editProfileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  editProfileText: {
    fontSize: 16,
    fontWeight: "400",
    color: "#3F362F",
    textDecorationLine: "underline",
    lineHeight: 19,
  },
  editProfileIcon: {
    fontSize: 14,
    color: "#3F362F",
  },
  rowsContainer: {
    marginTop: 8,
    gap: 2,
  },
  actionsContainer: {
    gap: 16,
    alignItems: "center",
  },
  logoutButton: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#3F362F",
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "400",
    color: "#3F362F",
    lineHeight: 19,
  },
  deleteAccountText: {
    fontSize: 16,
    fontWeight: "400",
    color: "#C0012C",
    lineHeight: 19,
    textAlign: "center",
  },
});
