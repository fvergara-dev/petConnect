import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import { decode } from "base64-arraybuffer";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
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
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../lib/supabase";

const COLORS = {
  background: "#fff8f4",
  surface: "#fff8f4",
  onSurface: "#482d00",
  primaryContainer: "#ffb05e",
  onPrimaryContainer: "#5b3300",
  surfaceContainer: "#ffebd4",
  tertiaryContainer: "#fdd400",
  onTertiaryContainer: "#594a00",
  secondaryContainer: "#cae6ff",
  onSecondaryContainer: "#005780",
  surfaceContainerHighest: "#ffddb3",
  onSurfaceVariant: "#7b5925",
  surfaceContainerLow: "#fff1e4",
  primary: "#8c5100",
  onPrimary: "#fff7f4",
  surfaceContainerLowest: "#ffffff",
  surfaceVariant: "#ffddb3",
  danger: "#aa371c",
};

export default function ProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [pet, setPet] = useState<any>(null);
  const [uploading, setUploading] = useState(false);

  // Como esta es la pestaña "Mi Perfil", es isMyProfile = true
  const isMyProfile = true;

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (!profileError && profileData) {
          setProfile(profileData);
        }

        const { data: petData, error: petError } = await supabase
          .from("pets")
          .select("*")
          .eq("owner_id", user.id)
          .limit(1)
          .single();

        if (!petError && petData) {
          setPet(petData);
        }
      }
    } catch (error) {
      console.log("Error general:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert("Error al cerrar sesión", error.message);
    } else {
      router.replace("/login");
    }
  };

  const confirmLogout = () => {
    if (Platform.OS === "web") {
      const confirm = window.confirm(
        "¿Estás seguro de que deseas salir de tu cuenta?",
      );
      if (confirm) handleLogout();
    } else {
      Alert.alert(
        "Cerrar sesión",
        "¿Estás seguro de que deseas salir de tu cuenta?",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Salir", style: "destructive", onPress: handleLogout },
        ],
      );
    }
  };

  const changeAvatar = async () => {
    try {
      setUploading(true);

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 5],
        quality: 0.8,
        base64: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        setUploading(false);
        return;
      }

      const base64Img = result.assets[0].base64;
      if (!base64Img) return;

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No hay usuario autenticado");

      // Si ya existía un avatar, lo eliminamos del Storage para no ocupar memoria inútil
      if (profile?.avatar_url) {
        const urlParts = profile.avatar_url.split("/avatars/");
        if (urlParts.length > 1) {
          const oldFilePath = urlParts[1];
          await supabase.storage.from("avatars").remove([oldFilePath]);
        }
      }

      const filePath = `${user.id}/${new Date().getTime()}.png`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, decode(base64Img), {
          contentType: "image/png",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setProfile({ ...profile, avatar_url: publicUrl });
    } catch (error: any) {
      if (Platform.OS === "web") {
        window.alert(error.message);
      } else {
        Alert.alert("Error subiendo avatar", error.message);
      }
    } finally {
      setUploading(false);
    }
  };

  const removeAvatar = async () => {
    try {
      setUploading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No hay usuario autenticado");

      // Primero, eliminamos físicamente el archivo del Storage referenciado
      if (profile?.avatar_url) {
        const urlParts = profile.avatar_url.split("/avatars/");
        if (urlParts.length > 1) {
          const oldFilePath = urlParts[1];
          await supabase.storage.from("avatars").remove([oldFilePath]);
        }
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("id", user.id);

      if (updateError) throw updateError;
      setProfile({ ...profile, avatar_url: null });
    } catch (error: any) {
      if (Platform.OS === "web") {
        window.alert(error.message);
      } else {
        Alert.alert("Error eliminando avatar", error.message);
      }
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top AppBar */}
      <View style={styles.appBar}>
        <View style={styles.appBarLeft}>
          <TouchableOpacity onPress={confirmLogout} style={styles.appBarAvatar}>
            <FontAwesome5 name="sign-out-alt" size={16} color={COLORS.danger} />
          </TouchableOpacity>
          <Text style={styles.appBarTitle}>PetConnect</Text>
        </View>
        <TouchableOpacity style={styles.notificationButton}>
          <MaterialIcons
            name="notifications"
            size={24}
            color={COLORS.primary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Hero Section */}
        <View style={styles.heroSection}>
          <TouchableOpacity
            style={styles.mainImageContainer}
            onPress={changeAvatar}
            disabled={uploading}
            activeOpacity={0.8}
          >
            {profile?.avatar_url ? (
              <Image
                source={{ uri: profile.avatar_url }}
                style={styles.mainImage}
              />
            ) : (
              <View style={[styles.mainImage, styles.placeholderImage]}>
                <FontAwesome5 name="camera" size={40} color={COLORS.primary} />
                <Text style={styles.placeholderText}>
                  Toca para añadir foto
                </Text>
              </View>
            )}

            {profile?.avatar_url && isMyProfile && (
              <TouchableOpacity
                style={styles.removeAvatarButton}
                onPress={removeAvatar}
                disabled={uploading}
              >
                <MaterialIcons name="delete" size={20} color="#FFF" />
              </TouchableOpacity>
            )}

            {uploading && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator size="large" color="#fff" />
              </View>
            )}

            <View style={styles.badgeAdoptado}>
              <Text style={styles.badgeAdoptadoText}>Adoptado</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.petInfoContainer}>
            <Text style={styles.petName}>{pet?.name || "Sin nombre"}</Text>

            <View style={styles.chipsRow}>
              <View style={styles.chipBlue}>
                <Text style={styles.chipBlueText}>
                  {pet?.breed || "Raza desconocida"}
                </Text>
              </View>
              <View style={styles.chipYellow}>
                <Text style={styles.chipYellowText}>2 años</Text>
              </View>
            </View>

            <View style={styles.aboutCard}>
              <Text style={styles.aboutLabel}>SOBRE MÍ</Text>
              <Text style={styles.aboutText}>
                "{pet?.personality || "Sin descripción detallada por ahora."}"
              </Text>
            </View>

            {/* Condicionar Botones: Solo si no es Mi Perfil */}
            {!isMyProfile && (
              <View style={styles.actionButtonsRow}>
                <TouchableOpacity style={styles.followButton}>
                  <MaterialIcons
                    name="favorite"
                    size={20}
                    color={COLORS.onPrimary}
                  />
                  <Text style={styles.followButtonText}>Seguir</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.shareButton}>
                  <MaterialIcons
                    name="share"
                    size={24}
                    color={COLORS.onSurface}
                  />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Bento Grid Gallery (Estático de Ejemplo) */}
        <View style={styles.gallerySection}>
          <View style={styles.galleryHeader}>
            <Text style={styles.galleryTitle}>
              Momentos de {pet?.name || "tu mascota"}
            </Text>
            <Text style={styles.gallerySubtitle}>3 fotos</Text>
          </View>

          <View style={styles.galleryGrid}>
            <View style={styles.galleryItemLarge}>
              <Image
                source={{
                  uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuCcMCmAiyPeR7G2XjLyeU_JRGEQmRo3AF4wwl_r0ZtvfqAqTr8DwZWMcxr0sRW0uuPklyIuDu2TttGvJYTw9cAlCRUibJ75E0qwFSR4RefrYN8w2WAF1xU2SogHBEk6ALvm7bo53g-IX-dz0-aCYS8Zw0qy5GkGcWcW5_c8IXu_2-qkIMva2yZNf0KSI9B8iSIr9mtqtXJ-qwcXXsp-DLB8Hs7BL9zNfU8g-sHzDi09W_X1396fEyqWRvTzMQRtMrej4j1MDSPQhhdD",
                }}
                style={styles.galleryImage}
              />
            </View>
            <View style={styles.galleryColumnRight}>
              <View style={styles.galleryItemSmall}>
                <Image
                  source={{
                    uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuDrkAMUkaSMdRqe5BSYX_QKYK1PwsJAQdXhWk294o6K77xqHun9rB6L9DvI1M99KScV2UXPS-4mjVEeatBdpfkNWRhK119whOJs49q3qvzgqTQ4cJTa3wVwO1hv2rxNlPX808ngO_n_jr9ohmxHBgCVFTR5gFVriRKckoDBbP2cK1FumQcVxSZIuexKns-QVJLQg_hPj6uk7Q0PKEnn_AsUSl6AUPEeHy6RyMvn5XRJLgaGCX2G3WchX-NFauVNrRyo5W0TX0odiTrX",
                  }}
                  style={styles.galleryImage}
                />
              </View>
              <View style={[styles.galleryItemSmall, { marginTop: 16 }]}>
                <Image
                  source={{
                    uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuASYUNuDQV018HwtPCNTG8azM-7CYlHfDoW9y8YJ57tnn_hjMV1kg7ZG_lFx7OciHfA2SQl8ygHMDi__MSMbqoJ4RigFdTn9NfbemEm-3IUX9xQ0L9gWQnftbizHhz-drXDWV7KkGDZTs_XU34oCywACHq0bh6U1xzV0edRTxOPAcFFIflopFk0UNwNEiRekfJyS6j2Rg763bo2tm1LZmTsUvpzNU53VEAMEL3nz8u7wgUhs_EP4KKO0aUE2nZq0c7zcgD6yiNqrn_z",
                  }}
                  style={styles.galleryImage}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>1.2k</Text>
            <Text style={styles.statLabel}>SEGUIDORES</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>850</Text>
            <Text style={styles.statLabel}>AMIGOS</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>INSIGNIAS</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === "android" ? 40 : 0,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 100, // Espacio para BottomNavBar
  },
  // App Bar
  appBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: COLORS.background,
  },
  appBarLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  appBarAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#FFEBD4",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF1E4",
  },
  appBarTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: COLORS.onSurface,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  // Hero Section
  heroSection: {
    marginTop: 20,
    marginBottom: 40,
  },
  mainImageContainer: {
    width: "100%",
    aspectRatio: 4 / 5,
    borderRadius: 24,
    backgroundColor: COLORS.surfaceContainer,
    transform: [{ rotate: "-1deg" }],
    shadowColor: COLORS.onSurface,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
    position: "relative",
  },
  mainImage: {
    width: "100%",
    height: "100%",
    borderRadius: 24,
  },
  placeholderImage: {
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    marginTop: 10,
    color: COLORS.primary,
    fontWeight: "bold",
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 24,
  },
  badgeAdoptado: {
    position: "absolute",
    bottom: -16,
    right: -16,
    backgroundColor: COLORS.tertiaryContainer,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    transform: [{ rotate: "3deg" }],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  badgeAdoptadoText: {
    color: COLORS.onTertiaryContainer,
    fontWeight: "bold",
    fontSize: 16,
  },
  removeAvatarButton: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "rgba(170, 55, 28, 0.8)", // Semi-transparent danger color
    padding: 10,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  petInfoContainer: {
    marginTop: 32,
  },
  petName: {
    fontSize: 48,
    fontWeight: "900",
    color: COLORS.onSurface,
    marginBottom: 12,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 24,
  },
  chipBlue: {
    backgroundColor: COLORS.secondaryContainer,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
  },
  chipBlueText: {
    color: COLORS.onSecondaryContainer,
    fontWeight: "700",
    fontSize: 14,
  },
  chipYellow: {
    backgroundColor: COLORS.surfaceContainerHighest,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  chipYellowText: {
    color: COLORS.onSurfaceVariant,
    fontWeight: "700",
    fontSize: 14,
  },
  aboutCard: {
    backgroundColor: COLORS.surfaceContainerLow,
    padding: 24,
    borderRadius: 16,
    marginBottom: 24,
  },
  aboutLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.onSurfaceVariant,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  aboutText: {
    fontSize: 16,
    lineHeight: 26,
    color: COLORS.onSurface,
    fontStyle: "italic",
  },
  actionButtonsRow: {
    flexDirection: "row",
  },
  followButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 16,
    marginRight: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  followButtonText: {
    color: COLORS.onPrimary,
    fontWeight: "bold",
    fontSize: 18,
    marginLeft: 8,
  },
  shareButton: {
    width: 60,
    height: 60,
    backgroundColor: COLORS.surfaceContainerHighest,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  // Gallery Section
  gallerySection: {
    marginBottom: 40,
  },
  galleryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  galleryTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.onSurface,
  },
  gallerySubtitle: {
    color: COLORS.onSurfaceVariant,
    fontWeight: "600",
  },
  galleryGrid: {
    flexDirection: "row",
    height: 380,
  },
  galleryItemLarge: {
    flex: 1,
    marginRight: 16,
    borderRadius: 16,
    overflow: "hidden",
  },
  galleryColumnRight: {
    flex: 1,
    justifyContent: "space-between",
  },
  galleryItemSmall: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
  },
  galleryImage: {
    width: "100%",
    height: "100%",
  },
  // Stats Section
  statsSection: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surfaceContainerLowest,
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: "center",
    marginHorizontal: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "900",
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: COLORS.onSurfaceVariant,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});
