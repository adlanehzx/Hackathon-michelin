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
import { useAuth } from "../context/AuthContext";

interface RegisterScreenProps {
  onGoToLogin: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onGoToLogin,
}) => {
  const { register } = useAuth();
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!nom || !prenom || !email || !password || !confirmPassword) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs");
      return;
    }

    if (password.length < 8) {
      Alert.alert(
        "Erreur",
        "Le mot de passe doit contenir au moins 8 caractères",
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Erreur", "Les mots de passe ne correspondent pas");
      return;
    }

    setIsLoading(true);
    try {
      await register(nom, prenom, email, password);
      Alert.alert("Succès", "Compte créé ! Veuillez vous connecter", [
        { text: "OK", onPress: onGoToLogin },
      ]);
    } catch (error: any) {
      Alert.alert("Erreur", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Inscription</Text>

      {/* Nom */}
      <Text style={styles.label}>Entrez votre nom</Text>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          placeholder="Dupont"
          value={nom}
          onChangeText={setNom}
          editable={!isLoading}
          placeholderTextColor="#bbb"
        />
        {nom.length > 0 && (
          <View style={styles.checkIcon}>
            <Text style={styles.checkText}>✓</Text>
          </View>
        )}
      </View>

      {/* Prénom */}
      <Text style={styles.label}>Entrez votre prénom</Text>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          placeholder="Jean"
          value={prenom}
          onChangeText={setPrenom}
          editable={!isLoading}
          placeholderTextColor="#bbb"
        />
        {prenom.length > 0 && (
          <View style={styles.checkIcon}>
            <Text style={styles.checkText}>✓</Text>
          </View>
        )}
      </View>

      {/* Email */}
      <Text style={styles.label}>Entrez votre adresse e-mail</Text>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          placeholder="abc12@gmail.com"
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

      {/* Mot de passe */}
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

      {/* Confirmer mot de passe */}
      <Text style={styles.label}>Confirmez votre mot de passe</Text>
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
          <Text style={styles.eyeText}>
            {showConfirmPassword ? "🙈" : "👁️"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bouton inscription */}
      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleRegister}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>S'inscrire</Text>
        )}
      </TouchableOpacity>

      {/* Lien connexion */}
      <TouchableOpacity onPress={onGoToLogin} disabled={isLoading}>
        <Text style={styles.loginText}>
          Vous avez déjà un compte ?{" "}
          <Text style={styles.loginLink}>Se connecter</Text>
        </Text>
      </TouchableOpacity>

      {/* Séparateur */}
      <Text style={styles.orText}>ou</Text>

      {/* Bouton Google */}
      <TouchableOpacity style={styles.socialButton}>
        <Text style={styles.googleG}>G</Text>
        <Text style={styles.socialButtonText}>Continuer avec Google</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingVertical: 48,
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
  loginText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  loginLink: {
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
