import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import authService from "../services/authService";

const FIGTREE_FONT = "Figtree-Medium";

interface ResetPasswordScreenProps {
  onGoToLogin: () => void;
  initialEmail?: string;
}

export const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({
  onGoToLogin,
  initialEmail = "",
}) => {
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedCode = code.trim().toUpperCase();

    if (
      !normalizedEmail ||
      !normalizedCode ||
      !newPassword ||
      !confirmPassword
    ) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs");
      return;
    }

    if (normalizedCode.length !== 8) {
      Alert.alert("Erreur", "Le code doit contenir exactement 8 caractères");
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert(
        "Erreur",
        "Le mot de passe doit contenir au moins 8 caractères",
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Erreur", "Les mots de passe ne correspondent pas");
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.resetPassword({
        email: normalizedEmail,
        code: normalizedCode,
        newPassword,
      });

      Alert.alert("Succès", response.message, [
        { text: "Retour connexion", onPress: onGoToLogin },
      ]);
    } catch (error: any) {
      Alert.alert(
        "Erreur",
        error?.error || "Impossible de réinitialiser le mot de passe",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Réinitialisation</Text>
      <Text style={styles.subtitle}>
        Saisis ton e-mail, le code reçu par e-mail et ton nouveau mot de passe.
      </Text>

      {/* Email */}
      <Text style={styles.label}>Adresse e-mail</Text>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          placeholder="exemple@email.com"
          value={email}
          onChangeText={setEmail}
          editable={!isLoading}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          placeholderTextColor="#bbb"
        />
        {email.length > 0 && (
          <View style={styles.checkIcon}>
            <Text style={styles.checkText}>✓</Text>
          </View>
        )}
      </View>

      {/* Code */}
      <Text style={styles.label}>Code à 8 caractères</Text>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          placeholder="ex: AB12CD34"
          value={code}
          onChangeText={setCode}
          editable={!isLoading}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={8}
          placeholderTextColor="#bbb"
        />
        {code.length === 8 && (
          <View style={styles.checkIcon}>
            <Text style={styles.checkText}>✓</Text>
          </View>
        )}
      </View>

      {/* Nouveau mot de passe */}
      <Text style={styles.label}>Nouveau mot de passe</Text>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          placeholder="••••••••••••••"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry={!showPassword}
          editable={!isLoading}
          placeholderTextColor="#bbb"
        />
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={() => setShowPassword(!showPassword)}
        >
          <Text style={styles.eyeText}>{showPassword ? "◉" : "◎"}</Text>
        </TouchableOpacity>
      </View>

      {/* Confirmer mot de passe */}
      <Text style={styles.label}>Confirmer le mot de passe</Text>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          placeholder="••••••••••••••"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showConfirmPassword}
          editable={!isLoading}
          placeholderTextColor="#bbb"
        />
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={() => setShowConfirmPassword(!showConfirmPassword)}
        >
          <Text style={styles.eyeText}>{showConfirmPassword ? "◉" : "◎"}</Text>
        </TouchableOpacity>
      </View>

      {/* Bouton */}
      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Modifier le mot de passe</Text>
        )}
      </TouchableOpacity>

      {/* Retour connexion */}
      <TouchableOpacity onPress={onGoToLogin} disabled={isLoading}>
        <Text style={styles.loginText}>
          Retour à la <Text style={styles.loginLink}>connexion</Text>
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    paddingHorizontal: 28,
    paddingTop: 80,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#111",
    marginBottom: 12,
    alignSelf: "center",
    fontFamily: FIGTREE_FONT,
  },
  subtitle: {
    fontSize: 14,
    color: "#aaa",
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 36,
    fontFamily: FIGTREE_FONT,
  },
  label: {
    alignSelf: "flex-start",
    fontSize: 14,
    color: "#333",
    marginBottom: 8,
    fontFamily: FIGTREE_FONT,
  },
  inputWrapper: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 30,
    paddingHorizontal: 18,
    backgroundColor: "#fff",
    marginBottom: 18,
    height: 54,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#333",
    height: 54,
    fontFamily: FIGTREE_FONT,
  },
  checkIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
  },
  checkText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    fontFamily: FIGTREE_FONT,
  },
  eyeIcon: {
    padding: 8,
  },
  eyeText: {
    fontSize: 18,
    color: "#999",
    fontFamily: FIGTREE_FONT,
  },
  button: {
    width: "100%",
    backgroundColor: "#111",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: FIGTREE_FONT,
  },
  loginText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    fontFamily: FIGTREE_FONT,
  },
  loginLink: {
    fontWeight: "bold",
    color: "#111",
    fontFamily: FIGTREE_FONT,
  },
});
