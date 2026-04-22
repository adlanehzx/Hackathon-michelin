import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import authService from "../services/authService";

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
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedCode = code.trim().toUpperCase();

    if (!normalizedEmail || !normalizedCode || !newPassword || !confirmPassword) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs");
      return;
    }

    if (normalizedCode.length !== 8) {
      Alert.alert("Erreur", "Le code doit contenir exactement 8 caractères");
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert("Erreur", "Le mot de passe doit contenir au moins 8 caractères");
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
    <View style={styles.container}>
      <Text style={styles.title}>Réinitialiser le mot de passe</Text>
      <Text style={styles.subtitle}>
        Saisis ton e-mail, le code reçu par email et ton nouveau mot de passe.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="E-mail"
        value={email}
        onChangeText={setEmail}
        editable={!isLoading}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        placeholderTextColor="#999"
      />

      <TextInput
        style={styles.input}
        placeholder="Code à 8 caractères"
        value={code}
        onChangeText={setCode}
        editable={!isLoading}
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={8}
        placeholderTextColor="#999"
      />

      <TextInput
        style={styles.input}
        placeholder="Nouveau mot de passe"
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
        editable={!isLoading}
        placeholderTextColor="#999"
      />

      <TextInput
        style={styles.input}
        placeholder="Confirmer le mot de passe"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        editable={!isLoading}
        placeholderTextColor="#999"
      />

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

      <TouchableOpacity onPress={onGoToLogin} disabled={isLoading}>
        <Text style={styles.link}>Retour à la connexion</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#1a1a1a",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    marginBottom: 24,
    color: "#666",
    textAlign: "center",
    lineHeight: 21,
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 14,
    marginBottom: 14,
    borderRadius: 10,
    fontSize: 16,
    color: "#333",
    backgroundColor: "#fff",
  },
  button: {
    width: "100%",
    backgroundColor: "#1a73e8",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  link: {
    marginTop: 20,
    color: "#1a73e8",
    fontSize: 14,
    fontWeight: "600",
  },
});
