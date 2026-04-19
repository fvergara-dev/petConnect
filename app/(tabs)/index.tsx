import FeedHeader from "@/components/feed/FeedHeader";
import FeedPost from "@/components/feed/FeedPost";
import Stories from "@/components/feed/Stories";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { supabase } from "../../lib/supabase";

export default function FeedScreen() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [editContent, setEditContent] = useState("");

  const backgroundColor = useThemeColor({}, "background");
  const tintColor = useThemeColor({}, "tint");

  const fetchPosts = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);

      // First, get the IDs of the users that the current user follows
      const { data: followsData, error: followsError } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);

      let allowedAuthorIds = [user.id]; // Always see own posts
      if (!followsError && followsData) {
        allowedAuthorIds = [
          ...allowedAuthorIds,
          ...followsData.map((f) => f.following_id),
        ];
      }

      // Then, fetch the posts only from allowed authors
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select("id, image_url, content, created_at, author_id, likes")
        .in("author_id", allowedAuthorIds)
        .order("created_at", { ascending: false });

      if (postsError) {
        console.error("Error fetching posts:", postsError);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // If we have posts, gather the author IDs
      const authorIds = postsData?.map((p) => p.author_id).filter((id) => id); // filter out nulls

      let profilesMap: Record<string, any> = {};

      if (authorIds && authorIds.length > 0) {
        const uniqueAuthorIds = Array.from(new Set(authorIds));
        // Fetch only the profiles we need for these posts
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("*")
          .in("id", uniqueAuthorIds);

        if (!profilesError && profilesData) {
          profilesMap = profilesData.reduce((acc: any, profile: any) => {
            acc[profile.id] = profile;
            return acc;
          }, {});
        }
      }

      // Map DB data to match FeedPost props expected by UI
      const formattedPosts =
        postsData?.map((post: any) => {
          const profile = profilesMap[post.author_id] || {};
          return {
            id: post.id,
            type: "single", // Currently all posts are single images
            isMine: post.author_id === user?.id,
            authorId: post.author_id,
            user: {
              name: profile.username || profile.full_name || "Usuario",
              location: "PetConnect",
              avatar:
                profile.avatar_url || "https://ui-avatars.com/api/?name=User",
            },
            image: post.image_url,
            likes: post.likes?.toString() || "0",
            comments: "0",
            captionUser: profile.username || profile.full_name || "Usuario",
            captionText: post.content || "",
            timeAgo: new Date(post.created_at).toLocaleDateString(),
          };
        }) || [];

      setPosts(formattedPosts);
    } catch (error) {
      console.error("Unexpected error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPosts();
    }, []),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchPosts();
  };

  const handleDeletePost = (id: string, imageUrl: string) => {
    performDelete(id, imageUrl);
  };

  const performDelete = async (id: string, imageUrl: string) => {
    try {
      if (imageUrl) {
        const urlParts = imageUrl.split("/posts/");
        if (urlParts.length > 1) {
          const filePath = urlParts[1];
          await supabase.storage.from("posts").remove([filePath]);
        }
      }
      const { error } = await supabase.from("posts").delete().eq("id", id);
      if (error) throw error;

      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch (error: any) {
      console.error("Failed to delete post:", error);
      if (Platform.OS === "web") {
        window.alert(
          "No se pudo eliminar el post. Comprueba permisos (RLS) en Supabase.",
        );
      } else {
        Alert.alert(
          "Error",
          "No se pudo eliminar el post. Comprueba permisos (RLS) en Supabase.",
        );
      }
    }
  };

  const saveEdit = async () => {
    if (!editingPost) return;
    try {
      const { error } = await supabase
        .from("posts")
        .update({ content: editContent })
        .eq("id", editingPost.id);

      if (error) throw error;

      setPosts((prev) =>
        prev.map((p) =>
          p.id === editingPost.id ? { ...p, captionText: editContent } : p,
        ),
      );
      setEditingPost(null);
    } catch (error: any) {
      console.error("Failed to update post:", error);
      if (Platform.OS === "web") {
        window.alert(
          "No se pudo actualizar. Comprueba permisos (RLS) en Supabase.",
        );
      } else {
        Alert.alert(
          "Error",
          "No se pudo actualizar. Comprueba permisos (RLS) en Supabase.",
        );
      }
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[
          styles.safeArea,
          { justifyContent: "center", alignItems: "center", backgroundColor },
        ]}
      >
        <ActivityIndicator size="large" color={tintColor} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
      <View style={[styles.container, { backgroundColor }]}>
        <FeedHeader />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={tintColor}
            />
          }
        >
          <Animated.View entering={FadeInUp.delay(100).duration(500)}>
            <Stories />
          </Animated.View>

          <View style={[styles.feedContainer, { backgroundColor }]}>
            {posts.map((post, index) => (
              <Animated.View
                key={post.id}
                entering={FadeInDown.delay(200 + index * 100).duration(500)}
              >
                <FeedPost
                  post={post}
                  onDelete={() => handleDeletePost(post.id, post.image)}
                  onEdit={() => {
                    setEditingPost(post);
                    setEditContent(post.captionText);
                  }}
                />
              </Animated.View>
            ))}
          </View>
        </ScrollView>

        {/* Modal for Editing Post */}
        <Modal
          visible={!!editingPost}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setEditingPost(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor }]}>
              <Text style={[styles.modalTitle, { color: tintColor }]}>
                Editar Publicación
              </Text>
              <TextInput
                style={[
                  styles.modalInput,
                  { color: tintColor, borderColor: tintColor },
                ]}
                multiline
                numberOfLines={4}
                value={editContent}
                onChangeText={setEditContent}
              />
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setEditingPost(null)}
                >
                  <Text style={styles.cancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveButton, { backgroundColor: tintColor }]}
                  onPress={saveEdit}
                >
                  <Text style={styles.saveText}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? 30 : 0,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Space for Bottom Tab
  },
  feedContainer: {
    marginTop: 10,
  },
  fab: {
    position: "absolute",
    right: 24,
    bottom: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  modalInput: {
    width: "100%",
    borderRadius: 12,
    padding: 15,
    textAlignVertical: "top",
    minHeight: 100,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#E5E5E5",
    marginRight: 10,
    alignItems: "center",
  },
  cancelText: {
    color: "#333",
    fontWeight: "bold",
  },
  saveButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    marginLeft: 10,
    alignItems: "center",
  },
  saveText: {
    color: "#FFF",
    fontWeight: "bold",
  },
});
