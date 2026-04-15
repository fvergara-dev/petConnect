import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../lib/supabase";

export default function FeedPost({
  post,
  onDelete,
  onEdit,
}: {
  post: any;
  onDelete?: () => void;
  onEdit?: () => void;
}) {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(parseInt(post.likes) || 0);
  const [showOptionsModal, setShowOptionsModal] = useState(false);

  useEffect(() => {
    const checkInitialLike = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("likes")
        .select("post_id")
        .eq("user_id", user.id)
        .eq("post_id", post.id)
        .single();
      if (data) setLiked(true);
    };
    checkInitialLike();
  }, [post.id]);

  const handleLike = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const newLiked = !liked;
    const newCount = newLiked ? likesCount + 1 : Math.max(0, likesCount - 1);

    // Optimistic UI update
    setLiked(newLiked);
    setLikesCount(newCount);

    try {
      if (newLiked) {
        // Registrar el like único
        const { error: likeError } = await supabase
          .from("likes")
          .insert({ user_id: user.id, post_id: post.id });
        if (likeError) throw likeError;
      } else {
        // Remover el like
        const { error: unlikeError } = await supabase
          .from("likes")
          .delete()
          .eq("user_id", user.id)
          .eq("post_id", post.id);
        if (unlikeError) throw unlikeError;
      }

      // Actualizar el contador general
      await supabase
        .from("posts")
        .update({ likes: newCount })
        .eq("id", post.id);
    } catch (err: any) {
      console.warn("No se pudo guardar el like único.", err.message);
      // Revert optimistic update
      setLiked(!newLiked);
      setLikesCount(likesCount);
    }
  };

  const handleComment = () => {
    if (Platform.OS === "web") {
      window.alert("¡Los comentarios estarán disponibles pronto!");
    } else {
      Alert.alert(
        "Comentarios",
        "¡Los comentarios estarán disponibles pronto!",
      );
    }
  };

  const showOptions = () => {
    if (post.isMine) {
      if (Platform.OS === "web") {
        setShowOptionsModal(true);
      } else {
        // Native offers robust actions sheet or nice Alert
        Alert.alert("Opciones", "¿Qué deseas hacer con esta publicación?", [
          { text: "Cancelar", style: "cancel" },
          { text: "Editar Descripción", onPress: onEdit },
          { text: "Eliminar", onPress: onDelete, style: "destructive" },
        ]);
      }
    } else {
      if (Platform.OS === "web") {
        window.alert("No puedes modificar las publicaciones de otros.");
      } else {
        Alert.alert(
          "Opciones",
          "No puedes modificar las publicaciones de otros.",
        );
      }
    }
  };

  if (post.type === "single") {
    return (
      <View style={styles.postContainer}>
        <Modal
          visible={showOptionsModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowOptionsModal(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowOptionsModal(false)}
          >
            <View style={styles.modalContent}>
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => {
                  setShowOptionsModal(false);
                  if (onEdit) onEdit();
                }}
              >
                <FontAwesome5 name="edit" size={16} color="#4A2A14" />
                <Text style={styles.modalOptionText}>Editar Descripción</Text>
              </TouchableOpacity>
              <View style={styles.modalDivider} />
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => {
                  setShowOptionsModal(false);
                  if (onDelete) onDelete();
                }}
              >
                <FontAwesome5 name="trash-alt" size={16} color="#FF4B4B" />
                <Text style={[styles.modalOptionText, { color: "#FF4B4B" }]}>
                  Eliminar
                </Text>
              </TouchableOpacity>
              <View style={styles.modalDivider} />
              <TouchableOpacity
                style={[styles.modalOption, { justifyContent: "center" }]}
                onPress={() => setShowOptionsModal(false)}
              >
                <Text style={[styles.modalOptionText, { color: "#8A5A19" }]}>
                  Cancelar
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        <View style={styles.postHeader}>
          <View style={styles.headerLeft}>
            <Image
              source={{ uri: post.user.avatar }}
              style={styles.postAvatar}
            />
            <View>
              <Text style={styles.userName}>{post.user.name}</Text>
              <Text style={styles.userSub}>{post.user.location}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={showOptions}>
            <FontAwesome5 name="ellipsis-h" size={16} color="#4A2A14" />
          </TouchableOpacity>
        </View>

        <View style={styles.imageContainer}>
          <Image
            source={{ uri: post.image }}
            style={styles.mainImage}
            resizeMode="cover"
          />

          <View style={styles.floatingActionBar}>
            <View style={styles.actionGroup}>
              <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
                <FontAwesome5
                  name="paw"
                  size={18}
                  color={liked ? "#FF4B4B" : "#8A5A19"}
                  solid={liked}
                />
                <Text style={styles.actionText}>{likesCount}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={handleComment}
              >
                <FontAwesome5 name="comment" size={18} color="#8A5A19" solid />
                <Text style={styles.actionText}>{post.comments}</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={() => {
                if (Platform.OS === "web") {
                  window.alert(
                    "¡La función de compartir estará disponible pronto!",
                  );
                } else {
                  Alert.alert("Compartir", "Función en desarrollo");
                }
              }}
            >
              <Ionicons name="share-social" size={22} color="#8A5A19" />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.caption}>
          <Text style={{ fontWeight: "bold" }}>{post.captionUser} </Text>
          {post.captionText}
        </Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  postContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.05)",
    elevation: 3,
  },
  postHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  postAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 10,
    backgroundColor: "#eee",
  },
  userName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#4A2A14",
  },
  userSub: {
    fontSize: 11,
    color: "#8A5A19",
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontWeight: "500",
  },
  imageContainer: {
    position: "relative",
    borderRadius: 20,
    overflow: "hidden",
    height: 320,
  },
  mainImage: {
    width: "100%",
    height: "100%",
    borderRadius: 20,
    backgroundColor: "#eee",
  },
  floatingActionBar: {
    position: "absolute",
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: "rgba(235, 230, 224, 0.95)",
    borderRadius: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  actionGroup: {
    flexDirection: "row",
    gap: 20,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionText: {
    fontWeight: "700",
    color: "#4A2A14",
    fontSize: 14,
  },
  caption: {
    marginTop: 16,
    color: "#4A2A14",
    lineHeight: 22,
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 16,
    width: 250,
    overflow: "hidden",
    boxShadow: "0px 4px 10px rgba(0,0,0,0.1)",
    elevation: 5,
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4A2A14",
  },
  modalDivider: {
    height: 1,
    backgroundColor: "#F0EBE1",
  },
});
