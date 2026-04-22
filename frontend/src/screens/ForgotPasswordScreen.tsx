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

interface ForgotPasswordScreenProps {
  onGoToLogin: () => void;
  onGoToResetPassword: (email: string) => void;
}

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({
  onGoToLogin,
  onGoToResetPassword,
}) => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const normalizedEmail = email.trim().toLowerCase();

  const handleSubmit = async () => {
    if (!normalizedEmail) {
      Alert.alert("Erreur", "Veuillez saisir votre e-mail");
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.forgotPassword({ email: normalizedEmail });

      Alert.alert("Code envoyé", response.message, [
        {
          text: "Saisir le code",
          onPress: () => onGoToResetPassword(normalizedEmail),
        },
      ]);
    } catch (error: any) {
      Alert.alert(
        "Erreur",
        error?.error || "Impossible d'envoyer le code de réinitialisation",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mot de passe oublié</Text>
      <Text style={styles.subtitle}>
        Saisis ton e-mail pour recevoir un code de 8 caractères.
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

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Envoyer le code</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => onGoToResetPassword(normalizedEmail)}
        disabled={isLoading}
      >
        <Text style={styles.link}>J'ai déjà reçu un code</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onGoToLogin} disabled={isLoading}>
        <Text style={styles.linkSecondary}>Retour à la connexion</Text>
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
    fontSize: 30,
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
    marginTop: 18,
    color: "#1a73e8",
    fontSize: 14,
    fontWeight: "600",
  },
  linkSecondary: {
    marginTop: 12,
    color: "#666",
    fontSize: 14,
    fontWeight: "500",
  },
});
