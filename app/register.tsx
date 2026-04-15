import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { decode } from "base64-arraybuffer";
import * as ImagePicker from "expo-image-picker";
import { Link, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../lib/supabase";

// Colores basados en el diseño
const COLORS = {
  background: "#FAF7F2",
  primaryText: "#4A2A14",
  secondaryText: "#7A6451",
  orangePrimary: "#FDB664",
  cardBg1: "#FFF3E3",
  inputBg1: "#FEE0B8",
  cardBg2: "#FFFFFF",
  inputBg2: "#FEF3E1",
  buttonBg: "#8A5A19",
  blueChipBg: "#E1F2FE",
  blueChipText: "#185B88",
  beigeChipBg: "#FCECDA",
  beigeChipText: "#876743",
  linkBlue: "#165D8B",
};

export default function RegisterScreen() {
  const router = useRouter();

  // Estados para Tu Cuenta
  const [nombreCompleto, setNombreCompleto] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Estados para Mascota
  const [nombreMascota, setNombreMascota] = useState("");
  const [especie, setEspecie] = useState("");
  const [raza, setRaza] = useState("");
  const [personalidadSeleccionada, setPersonalidadSeleccionada] =
    useState("Energético");

  const [loading, setLoading] = useState(false);

  // Estados para Fotografía
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null);

  const personalidades = ["Energético", "Tranquilo", "Juguetón", "Curioso"];

  // Redirigir al usuario si ya hay una sesión activa
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

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setAvatarUri(result.assets[0].uri);
      setAvatarBase64(result.assets[0].base64);
    }
  };

  const handleRegister = async () => {
    if (!email || !password || !nombreCompleto || !nombreMascota) {
      Alert.alert(
        "Campos requeridos",
        "Por favor completa todos los campos obligatorios.",
      );
      return;
    }

    setLoading(true);

    // Aquí registramos al usuario en Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      // Si el usuario ya existe, lo enviamos al login
      if (
        error.message.toLowerCase().includes("already registered") ||
        error.message.toLowerCase().includes("user already exists") ||
        error.status === 400
      ) {
        Alert.alert(
          "Usuario existente",
          "Esta cuenta ya está registrada. Te redirigiremos al inicio de sesión.",
        );
        router.replace("/login");
      } else {
        Alert.alert("Error de registro", error.message);
      }
      return;
    }

    // Si el registro de Auth fue exitoso, guardamos los datos extras en la base de datos
    if (data.user) {
      let publicAvatarUrl = null;

      // Si subió alguna foto, la subimos a Supabase Storage (suponiendo que usaremos el bucket "avatars" o "posts")
      if (avatarBase64) {
        const filePath = `${data.user.id}/avatar_${new Date().getTime()}.png`;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, decode(avatarBase64), {
            contentType: "image/png",
            upsert: false,
          });

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage
            .from("avatars")
            .getPublicUrl(filePath);
          publicAvatarUrl = publicUrlData.publicUrl;
        } else {
          console.warn("No se pudo subir la foto:", uploadError.message);
        }
      }

      // 1. Guardar o actualizar el perfil de usuario
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: data.user.id,
        full_name: nombreCompleto,
        email: email,
        avatar_url: publicAvatarUrl,
      });

      if (profileError) {
        console.warn("No se pudo crear el perfil público: ", profileError);
      }

      // 2. Guardar la primer mascota en la tabla "pets"
      const { error: petError } = await supabase.from("pets").insert({
        owner_id: data.user.id,
        name: nombreMascota,
        species: especie,
        breed: raza,
        personality: personalidadSeleccionada,
      });

      if (petError) {
        console.warn("No se pudo registrar la mascota: ", petError);
      }
    }

    setLoading(false);

    if (data.session) {
      // Redirigimos al feed si la sesión fue creada correctamente (Auto SignIn habilitado sin confirmar email)
      router.replace("/(tabs)");
    } else {
      Alert.alert(
        "Revisa tu correo",
        "Te hemos enviado un enlace para confirmar tu cuenta.",
      );
      router.replace("/login");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Cabecera */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <FontAwesome5 name="paw" size={24} color="#000" />
          </View>
          <Text style={styles.mainTitle}>PetConnect</Text>
          {/* Se usa relative aquí para simular la estructura, idealmente la imagen del perro iría como Absolute. */}
          <Text style={styles.subtitle}>
            Únete a la comunidad de amantes de mascotas más vibrante y crea el
            perfil digital de tu mejor amigo.
          </Text>
        </View>

        {/* --- Sección: Tu Cuenta --- */}
        <View style={styles.accountCard}>
          <Text style={styles.cardTitle}>Tu Cuenta</Text>
          <Text style={styles.cardSubtitle}>
            Información personal para el dueño
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>NOMBRE COMPLETO</Text>
            <TextInput
              style={styles.input1}
              placeholder="Ej. Ana García"
              placeholderTextColor="#CFA67A"
              value={nombreCompleto}
              onChangeText={setNombreCompleto}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>CORREO ELECTRÓNICO</Text>
            <TextInput
              style={styles.input1}
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
              style={styles.input1}
              placeholder="••••••••"
              secureTextEntry
              placeholderTextColor="#CFA67A"
              value={password}
              onChangeText={setPassword}
            />
          </View>
        </View>

        {/* --- Sección: Añade a tu primer compañero --- */}
        <View style={styles.companionCard}>
          <Text style={styles.cardTitle}>Añade a tu primer{"\n"}compañero</Text>
          <Text style={styles.cardSubtitle}>
            Presume de tu mascota ante el mundo.
          </Text>

          {/* Área de Subir Foto */}
          <View style={styles.photoUploadContainer}>
            <TouchableOpacity
              style={styles.avatarPlaceholder}
              onPress={pickImage}
              activeOpacity={0.8}
            >
              {avatarUri ? (
                <Image
                  source={{ uri: avatarUri }}
                  style={{ width: "100%", height: "100%" }}
                />
              ) : (
                <>
                  <Ionicons name="camera" size={32} color="#8A6E4F" />
                  <Text style={styles.photoUploadText}>SUBIR FOTO</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.editBadge} onPress={pickImage}>
              <FontAwesome5 name="pencil-alt" size={14} color="#FFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>NOMBRE DE LA MASCOTA</Text>
            <TextInput
              style={styles.input2}
              placeholder="Ej. Buddy"
              placeholderTextColor="#D5BA9E"
              value={nombreMascota}
              onChangeText={setNombreMascota}
            />
          </View>

          <View style={styles.rowInputs}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.label}>ESPECIE</Text>
              <TextInput
                style={styles.input2}
                placeholder="Perro"
                placeholderTextColor="#D5BA9E"
                value={especie}
                onChangeText={setEspecie}
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1, marginLeft: 10 }]}>
              <Text style={styles.label}>RAZA</Text>
              <TextInput
                style={styles.input2}
                placeholder="Ej. Beagle"
                placeholderTextColor="#D5BA9E"
                value={raza}
                onChangeText={setRaza}
              />
            </View>
          </View>

          {/* Personalidad (Chips) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>PERSONALIDAD</Text>
            <View style={styles.chipsContainer}>
              {personalidades.map((item) => {
                const isSelected = item === personalidadSeleccionada;
                return (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.chip,
                      isSelected ? styles.chipSelected : styles.chipInactive,
                    ]}
                    onPress={() => setPersonalidadSeleccionada(item)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        isSelected
                          ? styles.chipTextSelected
                          : styles.chipTextInactive,
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* Botón Principal */}
        <TouchableOpacity
          style={[styles.mainButton, loading && { opacity: 0.7 }]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.mainButtonText}>Empezar mi Aventura</Text>
          )}
        </TouchableOpacity>

        {/* Iniciar sesión (Footer) */}
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>¿Ya tienes una cuenta? </Text>
          <Link href="/" asChild>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Inicia sesión aquí</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === "android" ? 30 : 0,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  logoContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.orangePrimary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  mainTitle: {
    fontSize: 48,
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
    maxWidth: "90%",
  },
  accountCard: {
    backgroundColor: COLORS.cardBg1,
    width: "100%",
    borderRadius: 24,
    padding: 24,
    marginBottom: 15, // Solapa visualmente o está cerca
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.primaryText,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: COLORS.secondaryText,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primaryText,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  input1: {
    backgroundColor: COLORS.inputBg1,
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.primaryText,
  },
  input2: {
    backgroundColor: COLORS.inputBg2,
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.primaryText,
  },
  dropdownFake: {
    backgroundColor: COLORS.inputBg2,
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  companionCard: {
    backgroundColor: COLORS.cardBg2,
    width: "100%",
    borderRadius: 24,
    padding: 24,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  photoUploadContainer: {
    alignSelf: "flex-start",
    marginBottom: 20,
    marginTop: 10,
    position: "relative",
  },
  avatarPlaceholder: {
    width: 130,
    height: 130,
    borderRadius: 50,
    backgroundColor: "#EBE2D4",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderTopLeftRadius: 60,
    borderTopRightRadius: 60,
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
  },
  photoUploadText: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: "bold",
    color: "#8A6E4F",
    letterSpacing: 0.5,
  },
  editBadge: {
    position: "absolute",
    right: 0,
    bottom: 5,
    backgroundColor: "#6C481A",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  rowInputs: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 5,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  chipSelected: {
    backgroundColor: COLORS.blueChipBg,
  },
  chipInactive: {
    backgroundColor: COLORS.beigeChipBg,
  },
  chipText: {
    fontSize: 14,
    fontWeight: "600",
  },
  chipTextSelected: {
    color: COLORS.blueChipText,
  },
  chipTextInactive: {
    color: COLORS.beigeChipText,
  },
  mainButton: {
    backgroundColor: COLORS.buttonBg,
    width: "100%",
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: "center",
    marginBottom: 20,
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
  },
  footerText: {
    color: COLORS.secondaryText,
    fontSize: 14,
  },
  footerLink: {
    color: COLORS.linkBlue,
    fontSize: 14,
    fontWeight: "bold",
  },
});
