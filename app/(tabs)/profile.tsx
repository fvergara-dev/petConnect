import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import { decode } from "base64-arraybuffer";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
  const [posts, setPosts] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  // Estados para seguidores y seguidos
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<"followers" | "following">(
    "followers",
  );
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});

  const [genericAlert, setGenericAlert] = useState<{
    title: string;
    message: string;
  } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    breed: "",
    personality: "",
  });
  const [savingEdit, setSavingEdit] = useState(false);

  // Como esta es la pestaña "Mi Perfil", es isMyProfile = true
  const isMyProfile = true;

  useFocusEffect(
    useCallback(() => {
      fetchProfileData();

      let isMounted = true;
      let subscription: any = null;
      let userId: string | null = null;

      const fetchUnread = async () => {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user || !isMounted) return;
        userId = user.id;

        const { count, error } = await supabase
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("read", false);

        if (!error && isMounted) {
          setUnreadCount(count || 0);
        }

        if (isMounted) {
          subscription = supabase
            .channel(`profile:notifications:${user.id}`)
            .on(
              "postgres_changes",
              {
                event: "INSERT",
                schema: "public",
                table: "notifications",
                filter: `user_id=eq.${user.id}`,
              },
              () => {
                if (isMounted) setUnreadCount((prev) => prev + 1);
              },
            )
            .subscribe();
        }
      };

      fetchUnread();

      return () => {
        isMounted = false;
        if (subscription) supabase.removeChannel(subscription);
      };
    }, []),
  );

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

        const { data: postsData, error: postsError } = await supabase
          .from("posts")
          .select("*")
          .eq("author_id", user.id)
          .order("created_at", { ascending: false });

        if (!postsError && postsData) {
          setPosts(postsData);
        }

        // Fetch Follows
        const { data: followingData } = await supabase
          .from("follows")
          .select("following_id")
          .eq("follower_id", user.id);

        const { data: followersData } = await supabase
          .from("follows")
          .select("follower_id")
          .eq("following_id", user.id);

        const followedIds = followingData?.map((f) => f.following_id) || [];
        const followerIds = followersData?.map((f) => f.follower_id) || [];

        const newFollowMap: Record<string, boolean> = {};
        followedIds.forEach((id) => (newFollowMap[id] = true));
        setFollowingMap(newFollowMap);

        if (followedIds.length > 0 || followerIds.length > 0) {
          const uniqueIds = Array.from(
            new Set([...followedIds, ...followerIds]),
          );
          const { data: profilesData, error: profError } = await supabase
            .from("profiles")
            .select("*")
            .in("id", uniqueIds);

          if (profError) {
            console.error("Error fetching profiles:", profError);
          }

          if (profilesData) {
            setFollowing(
              profilesData.filter((p) => followedIds.includes(p.id)),
            );
            setFollowers(
              profilesData.filter((p) => followerIds.includes(p.id)),
            );
          }
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
      setGenericAlert({
        title: "Error al cerrar sesión",
        message: error.message,
      });
    } else {
      router.replace("/login");
    }
  };

  const confirmLogout = () => {
    setConfirmModal({
      title: "Cerrar sesión",
      message: "¿Estás seguro de que deseas salir de tu cuenta?",
      onConfirm: handleLogout,
    });
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
      setGenericAlert({
        title: "Error subiendo avatar",
        message: error.message,
      });
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
      setGenericAlert({
        title: "Error eliminando avatar",
        message: error.message,
      });
    } finally {
      setUploading(false);
    }
  };

  const handleOpenEditModal = () => {
    setEditForm({
      name: pet?.name || "",
      breed: pet?.breed || "",
      personality: pet?.personality || "",
    });
    setEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    try {
      setSavingEdit(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No hay usuario autenticado.");

      let updatedPet;
      if (pet?.id) {
        // Update existing pet
        const { data, error } = await supabase
          .from("pets")
          .update({
            name: editForm.name,
            breed: editForm.breed,
            personality: editForm.personality,
          })
          .eq("id", pet.id)
          .select()
          .single();

        if (error) throw error;
        updatedPet = data;
      } else {
        // Insert new pet
        const { data, error } = await supabase
          .from("pets")
          .insert({
            owner_id: user.id,
            name: editForm.name,
            breed: editForm.breed,
            species: "Perro",
            personality: editForm.personality,
          })
          .select()
          .single();

        if (error) throw error;
        updatedPet = data;
      }

      setPet(updatedPet);
      setEditModalVisible(false);
      setGenericAlert({
        title: "¡Perfil Actualizado!",
        message: "Los datos de la mascota se guardaron correctamente.",
      });
    } catch (error: any) {
      setGenericAlert({
        title: "Error guardando",
        message: error.message,
      });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleFollowUser = async (accountId: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const isFollowing = followingMap[accountId];

      // Update UI optimistically
      setFollowingMap((prev) => ({ ...prev, [accountId]: !isFollowing }));

      if (isFollowing) {
        await supabase
          .from("follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", accountId);

        setFollowing((prev) => prev.filter((f) => f.id !== accountId));
      } else {
        await supabase
          .from("follows")
          .insert({ follower_id: user.id, following_id: accountId });

        const { error: notifError } = await supabase
          .from("notifications")
          .insert({
            user_id: accountId,
            actor_id: user.id,
            type: "follow",
          });
        if (notifError)
          console.error("Error trigger follow notification:", notifError);

        // Fetch the user data again minimally to add to 'following' list
        const { data: newFollowing, error: nfError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", accountId)
          .single();

        if (nfError) {
          console.error("Error new following profile", nfError);
        }

        if (newFollowing) {
          setFollowing((prev) => [...prev, newFollowing]);
        }
      }
    } catch (e) {
      console.warn("Error following", e);
    }
  };

  const openFollowModal = (type: "followers" | "following") => {
    setModalType(type);
    setModalVisible(true);
  };

  const renderFollowMenu = () => {
    const list = modalType === "followers" ? followers : following;

    return (
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {modalType === "followers" ? "Seguidores" : "Seguidos"}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialIcons
                  name="close"
                  size={24}
                  color={COLORS.onSurface}
                />
              </TouchableOpacity>
            </View>

            {list.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Aún no hay usuarios.</Text>
              </View>
            ) : (
              <FlatList
                data={list}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingBottom: 20 }}
                renderItem={({ item }) => (
                  <View style={styles.userListItem}>
                    <View style={styles.userInfoRow}>
                      {item.avatar_url ? (
                        <Image
                          source={{ uri: item.avatar_url }}
                          style={styles.userAvatarSm}
                        />
                      ) : (
                        <View
                          style={[
                            styles.userAvatarSm,
                            {
                              backgroundColor: COLORS.surfaceVariant,
                              justifyContent: "center",
                              alignItems: "center",
                            },
                          ]}
                        >
                          <MaterialIcons
                            name="person"
                            size={20}
                            color={COLORS.primary}
                          />
                        </View>
                      )}
                      <Text style={styles.userNameSm}>
                        {item.full_name || item.username || "Usuario"}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.modalFollowBtn,
                        followingMap[item.id] ? styles.modalFollowingBtn : {},
                      ]}
                      onPress={() => handleFollowUser(item.id)}
                    >
                      <Text
                        style={[
                          styles.modalFollowBtnText,
                          followingMap[item.id]
                            ? { color: COLORS.onSurface }
                            : {},
                        ]}
                      >
                        {followingMap[item.id] ? "Siguiendo" : "Seguir"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    );
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
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => router.push("/(tabs)/notifications")}
        >
          <MaterialIcons
            name="notifications"
            size={24}
            color={COLORS.primary}
          />
          {unreadCount > 0 && <View style={styles.badge} />}
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
          </TouchableOpacity>

          <View style={styles.petInfoContainer}>
            <Text style={styles.petName}>{pet?.name || "Sin nombre"}</Text>

            <View style={styles.chipsRow}>
              <View style={styles.chipBlue}>
                <Text style={styles.chipBlueText}>
                  {pet?.breed || "Raza desconocida"}
                </Text>
              </View>
            </View>

            <View style={styles.aboutCard}>
              <Text style={styles.aboutLabel}>SOBRE MÍ</Text>
              <Text style={styles.aboutText}>
                &quot;
                {pet?.personality || "Sin descripción detallada por ahora."}
                &quot;
              </Text>
            </View>

            {/* Condicionar Botones: Solo si no es Mi Perfil */}
            {!isMyProfile ? (
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
            ) : (
              <View style={styles.actionButtonsRow}>
                <TouchableOpacity
                  style={[
                    styles.followButton,
                    { backgroundColor: COLORS.surfaceContainerHighest },
                  ]}
                  onPress={handleOpenEditModal}
                >
                  <FontAwesome5
                    name="edit"
                    size={16}
                    color={COLORS.onSurface}
                  />
                  <Text
                    style={[
                      styles.followButtonText,
                      { color: COLORS.onSurface },
                    ]}
                  >
                    Editar Perfil y Mascota
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Bento Grid Gallery */}
        <View style={styles.gallerySection}>
          <View style={styles.galleryHeader}>
            <Text style={styles.galleryTitle}>
              Momentos de {pet?.name || "tu mascota"}
            </Text>
            <Text style={styles.gallerySubtitle}>
              {posts.length} {posts.length === 1 ? "foto" : "fotos"}
            </Text>
          </View>

          {posts.length > 0 ? (
            <View style={styles.galleryGrid}>
              <View style={styles.galleryItemLarge}>
                <Image
                  source={{ uri: posts[0]?.image_url }}
                  style={styles.galleryImage}
                />
              </View>
              {posts.length > 1 && (
                <View style={styles.galleryColumnRight}>
                  <View style={styles.galleryItemSmall}>
                    <Image
                      source={{ uri: posts[1]?.image_url }}
                      style={styles.galleryImage}
                    />
                  </View>
                  {posts.length > 2 && (
                    <View style={[styles.galleryItemSmall, { marginTop: 16 }]}>
                      <Image
                        source={{ uri: posts[2]?.image_url }}
                        style={styles.galleryImage}
                      />
                    </View>
                  )}
                </View>
              )}
            </View>
          ) : (
            <View style={{ alignItems: "center", marginVertical: 40 }}>
              <Text style={{ color: COLORS.onSurfaceVariant }}>
                Aún no hay fotos.
              </Text>
            </View>
          )}
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => openFollowModal("followers")}
          >
            <Text style={styles.statValue}>{followers.length}</Text>
            <Text style={styles.statLabel}>SEGUIDORES</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => openFollowModal("following")}
          >
            <Text style={styles.statValue}>{following.length}</Text>
            <Text style={styles.statLabel}>AMIGOS</Text>
          </TouchableOpacity>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{posts.length}</Text>
            <Text style={styles.statLabel}>PUBLICACIONES</Text>
          </View>
        </View>
      </ScrollView>

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

      {/* Confirm Action Modal */}
      {confirmModal && (
        <Modal transparent animationType="fade" visible={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContentCentered}>
              <Text style={styles.modalTitle}>{confirmModal.title}</Text>
              <Text style={styles.modalText}>{confirmModal.message}</Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonSecondary]}
                  onPress={() => setConfirmModal(null)}
                >
                  <Text style={styles.modalButtonTextSecondary}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonDanger]}
                  onPress={() => {
                    confirmModal.onConfirm();
                    setConfirmModal(null);
                  }}
                >
                  <Text style={styles.modalButtonTextPrimary}>Confirmar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Modal para Editar Mascota */}
      {editModalVisible && (
        <Modal
          transparent
          animationType="slide"
          visible={true}
          onRequestClose={() => setEditModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContentCentered, { width: "90%" }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Editar Mascota</Text>
                <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                  <MaterialIcons
                    name="close"
                    size={24}
                    color={COLORS.onSurface}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Nombre</Text>
                <TextInput
                  style={styles.editInput}
                  value={editForm.name}
                  onChangeText={(t) => setEditForm({ ...editForm, name: t })}
                  placeholder="Ej. Max"
                  placeholderTextColor={COLORS.onSurfaceVariant}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Raza</Text>
                <TextInput
                  style={styles.editInput}
                  value={editForm.breed}
                  onChangeText={(t) => setEditForm({ ...editForm, breed: t })}
                  placeholder="Ej. Bulldog"
                  placeholderTextColor={COLORS.onSurfaceVariant}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Sobre Mí</Text>
                <TextInput
                  style={[
                    styles.editInput,
                    { height: 80, textAlignVertical: "top" },
                  ]}
                  value={editForm.personality}
                  onChangeText={(t) =>
                    setEditForm({ ...editForm, personality: t })
                  }
                  placeholder="Describe a tu mascota..."
                  placeholderTextColor={COLORS.onSurfaceVariant}
                  multiline
                />
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonPrimary]}
                  onPress={handleSaveProfile}
                  disabled={savingEdit}
                >
                  {savingEdit ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.modalButtonTextPrimary}>
                      Guardar Perfil
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {renderFollowMenu()}
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
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: 5,
    right: 5,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: "#FAF7F2", // mask background
    backgroundColor: "#C84D3B",
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContentCentered: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 24,
    margin: 24,
    padding: 24,
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: "50%",
    padding: 24,
  },
  modalText: {
    fontSize: 16,
    color: COLORS.onSurface,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 24,
  },
  inputContainer: {
    width: "100%",
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.onSurfaceVariant,
    marginBottom: 8,
  },
  editInput: {
    backgroundColor: COLORS.surfaceContainerLow,
    color: COLORS.onSurface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.surfaceVariant,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceVariant,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.onSurface,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.onSurfaceVariant,
  },
  userListItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  userInfoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  userAvatarSm: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userNameSm: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.onSurface,
  },
  modalFollowBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  modalFollowingBtn: {
    backgroundColor: COLORS.surfaceContainerHighest,
  },
  modalFollowBtnText: {
    color: COLORS.onPrimary,
    fontWeight: "bold",
    fontSize: 14,
  },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 100,
    alignItems: "center",
  },
  modalButtonPrimary: {
    backgroundColor: COLORS.primary,
  },
  modalButtonSecondary: {
    backgroundColor: COLORS.surfaceContainerHighest,
    marginRight: 10,
  },
  modalButtonDanger: {
    backgroundColor: COLORS.danger,
  },
  modalButtonTextPrimary: {
    color: COLORS.onPrimary,
    fontWeight: "bold",
    fontSize: 14,
  },
  modalButtonTextSecondary: {
    color: COLORS.onSurface,
    fontWeight: "bold",
    fontSize: 14,
  },
});
