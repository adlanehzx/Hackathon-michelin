import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { useAuth } from "../context/AuthContext";
import { LoginScreen } from "./LoginScreen";
import { ForgotPasswordScreen } from "./ForgotPasswordScreen";
import { ResetPasswordScreen } from "./ResetPasswordScreen";
import { RegisterScreen } from "./RegisterScreen";
import { HomeScreen } from "./HomeScreen";

type AuthView = "login" | "register" | "forgot" | "reset";

export const ProfileScreen: React.FC = () => {
  const { isSignedIn } = useAuth();
  const [authView, setAuthView] = useState<AuthView>("login");
  const [resetEmail, setResetEmail] = useState("");

  if (isSignedIn) {
    return (
      <View style={styles.container}>
        <HomeScreen />
      </View>
    );
  }

  return (
    <View style={[styles.container, { flex: 1 }]}>
      {authView === "register" ? (
        <RegisterScreen onGoToLogin={() => setAuthView("login")} />
      ) : authView === "forgot" ? (
        <ForgotPasswordScreen
          onGoToLogin={() => setAuthView("login")}
          onGoToResetPassword={(email) => {
            setResetEmail(email);
            setAuthView("reset");
          }}
        />
      ) : authView === "reset" ? (
        <ResetPasswordScreen
          initialEmail={resetEmail}
          onGoToLogin={() => setAuthView("login")}
        />
      ) : (
        <LoginScreen
          onGoToRegister={() => setAuthView("register")}
          onGoToForgotPassword={() => setAuthView("forgot")}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
