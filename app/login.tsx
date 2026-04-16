import { FontAwesome5 } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../lib/supabase";

const COLORS = {
  background: "#FAF7F2",
  primaryText: "#4A2A14",
  secondaryText: "#7A6451",
  orangePrimary: "#FDB664",
  inputBg1: "#FEE0B8",
  buttonBg: "#8A5A19",
  linkBlue: "#165D8B",
};

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [genericAlert, setGenericAlert] = useState<{
    title: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace("/(tabs)");
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        router.replace("/(tabs)");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      setGenericAlert({
        title: "Error",
        message: "Por favor ingresa tu correo y contraseña.",
      });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);

    if (error) {
      setGenericAlert({
        title: "Error al iniciar sesión",
        message: error.message,
      });
    } else {
      router.replace("/(tabs)");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <FontAwesome5 name="paw" size={40} color="#000" />
          </View>
          <Text style={styles.mainTitle}>PetConnect</Text>
          <Text style={styles.subtitle}>
            Bienvenido de nuevo a la mejor comunidad de amantes de mascotas.
          </Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>CORREO ELECTRÓNICO</Text>
            <TextInput
              style={styles.input}
              placeholder="tu@email.com"
              keyboardType="email-address"
              placeholderTextColor="#CFA67A"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>CONTRASEÑA</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              secureTextEntry
              placeholderTextColor="#CFA67A"
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity
            style={[styles.mainButton, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.mainButtonText}>Iniciar sesión</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>¿Aún no tienes cuenta? </Text>
          <Link href="/register" asChild>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Regístrate aquí</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>

      {/* Generic Alert Modal */}
      {genericAlert && (
        <Modal transparent animationType="fade" visible={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContentCentered}>
              <Text style={styles.modalTitle}>{genericAlert.title}</Text>
              <Text style={styles.modalText}>{genericAlert.message}</Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonPrimary]}
                  onPress={() => setGenericAlert(null)}
                >
                  <Text style={styles.modalButtonTextPrimary}>OK</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === "android" ? 30 : 0,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.orangePrimary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  mainTitle: {
    fontSize: 42,
    fontWeight: "900",
    color: COLORS.primaryText,
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.secondaryText,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  formContainer: {
    width: "100%",
    backgroundColor: "#FFF3E3",
    borderRadius: 24,
    padding: 24,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primaryText,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: COLORS.inputBg1,
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    color: COLORS.primaryText,
  },
  mainButton: {
    backgroundColor: COLORS.buttonBg,
    width: "100%",
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#8A5A19",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  mainButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  footerText: {
    color: COLORS.secondaryText,
    fontSize: 15,
  },
  footerLink: {
    color: COLORS.linkBlue,
    fontSize: 15,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
  },
  modalContentCentered: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    margin: 24,
    padding: 24,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.primaryText,
    marginBottom: 10,
    textAlign: "center",
  },
  modalText: {
    fontSize: 16,
    color: COLORS.secondaryText,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 24,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
  },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 100,
    alignItems: "center",
  },
  modalButtonPrimary: {
    backgroundColor: COLORS.buttonBg,
  },
  modalButtonTextPrimary: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 14,
  },
});
