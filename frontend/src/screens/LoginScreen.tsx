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
import { useAuth } from "../context/AuthContext";

interface LoginScreenProps {
  onGoToRegister: () => void;
  onGoToForgotPassword: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onGoToRegister,
  onGoToForgotPassword,
}) => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs");
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
    } catch (error: any) {
      Alert.alert("Erreur d'authentification", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connexion</Text>

      {/* Champ email */}
      <Text style={styles.label}>Entrez votre adresse e-mail</Text>
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

      {/* Champ mot de passe */}
      <Text style={styles.label}>Entrez votre mot de passe</Text>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          placeholder="••••••••••••••"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          editable={!isLoading}
          placeholderTextColor="#bbb"
        />
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={() => setShowPassword(!showPassword)}
        >
          <Text style={styles.eyeText}>{showPassword ? "🙈" : "👁️"}</Text>
        </TouchableOpacity>
      </View>

      {/* Mot de passe oublié */}
      <TouchableOpacity
        onPress={onGoToForgotPassword}
        disabled={isLoading}
        style={styles.forgotContainer}
      >
        <Text style={styles.forgotText}>mot de passe oublié ?</Text>
      </TouchableOpacity>

      {/* Bouton connexion */}
      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Connexion</Text>
        )}
      </TouchableOpacity>

      {/* Lien inscription */}
      <TouchableOpacity onPress={onGoToRegister} disabled={isLoading}>
        <Text style={styles.registerText}>
          Vous n'avez pas de compte ?{" "}
          <Text style={styles.registerLink}>S'inscrire</Text>
        </Text>
      </TouchableOpacity>

      <Text style={styles.orText}>ou</Text>

      <TouchableOpacity style={styles.socialButton}>
        <Text style={styles.googleG}>G</Text>
        <Text style={styles.socialButtonText}>Continuer avec Google</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#111",
    marginBottom: 36,
  },
  label: {
    alignSelf: "flex-start",
    fontSize: 14,
    color: "#333",
    marginBottom: 8,
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
  },
  eyeIcon: {
    padding: 4,
  },
  eyeText: {
    fontSize: 16,
    color: "#999",
  },
  forgotContainer: {
    alignSelf: "flex-end",
    marginBottom: 16,
  },
  forgotText: {
    color: "#555",
    fontSize: 13,
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
  },
  registerText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  registerLink: {
    fontWeight: "bold",
    color: "#111",
  },
  orText: {
    color: "#aaa",
    fontSize: 13,
    marginBottom: 14,
  },
  socialButton: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 30,
    paddingVertical: 14,
    marginBottom: 14,
    gap: 10,
  },
  googleG: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4285F4",
  },
  socialButtonText: {
    fontSize: 15,
    color: "#333",
  },
});
