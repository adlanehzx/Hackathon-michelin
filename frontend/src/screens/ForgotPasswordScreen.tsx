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
      const response = await authService.forgotPassword({
        email: normalizedEmail,
      });

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
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Mot de passe oublié</Text>
      <Text style={styles.subtitle}>
        Saisissez votre e-mail pour recevoir un code de 8 caractères.
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

      {/* Bouton envoyer */}
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

      {/* Déjà un code */}
      <TouchableOpacity
        onPress={() => onGoToResetPassword(normalizedEmail)}
        disabled={isLoading}
      >
        <Text style={styles.alreadyText}>
          J'ai déjà reçu un code →{" "}
          <Text style={styles.alreadyLink}>Saisir le code</Text>
        </Text>
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
  button: {
    width: "100%",
    backgroundColor: "#C0012C",
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
  alreadyText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 14,
    textAlign: "center",
    fontFamily: FIGTREE_FONT,
  },
  alreadyLink: {
    fontWeight: "bold",
    color: "#111",
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
