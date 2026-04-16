import { FontAwesome5 } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
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
import Animated, { FadeInUp } from "react-native-reanimated";
import { supabase } from "../../lib/supabase";

const CATEGORIES = ["Todos", "Perros", "Gatos", "Aves", "Exóticos"];

export default function ExploreScreen() {
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestedAccounts, setSuggestedAccounts] = useState<any[]>([]);
  const [explorePosts, setExplorePosts] = useState<any[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string | null>(
    null,
  );

  const fetchExploreData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);

      if (!user?.id) return;

      const { data: userProfile } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", user.id)
        .single();
      setCurrentUserAvatar(userProfile?.avatar_url || null);

      // 1. Obtener a quién seguimos para excluirlos de sugeridos y mostrar estado del botón
      const { data: followsData } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);

      const followedIds = followsData?.map((f) => f.following_id) || [];
      const newFollowMap: Record<string, boolean> = {};
      followedIds.forEach((id) => (newFollowMap[id] = true));
      setFollowingMap(newFollowMap);

      // 2. Traer perfiles sugeridos (que no seamos nosotros ni los que ya seguimos)
      setLoadingAccounts(true);

      let profilesQuery = supabase
        .from("profiles")
        .select("*")
        .neq("id", user.id);

      const { data: profilesData, error: profilesError } =
        await profilesQuery.limit(10);

      if (profilesError) {
        console.warn("Profiles error:", profilesError);
      }

      if (profilesData) {
        // Filtrar localmente los que ya seguimos
        const unfollowedProfiles = profilesData.filter(
          (p) => !followedIds.includes(p.id),
        );

        // Obtener la mascota principal de estos perfiles
        const suggested = [];
        for (const profile of unfollowedProfiles.slice(0, 5)) {
          // Mostrar 5 max
          const { data: pets } = await supabase
            .from("pets")
            .select("breed, species")
            .eq("owner_id", profile.id)
            .limit(1);

          const petData = pets && pets.length > 0 ? pets[0] : null;

          suggested.push({
            id: profile.id,
            name: profile.full_name || profile.username || "Usuario",
            breed: petData
              ? `${petData.breed || petData.species}`
              : "Sin mascota",
            image:
              profile.avatar_url ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                profile.full_name || profile.username || "User",
              )}&background=F0EBE1&color=8A5A19`,
          });
        }
        setSuggestedAccounts(suggested);
      }
      setLoadingAccounts(false);

      fetchPostsForCategory("Todos", searchQuery);
    } catch (err) {
      console.warn("Error cargando explore data:", err);
      setLoadingAccounts(false);
    }
  };

  const fetchPostsForCategory = async (category: string, search: string) => {
    setLoadingPosts(true);
    try {
      let allowedOwnerIds: string[] | null = null;

      // Si no es "Todos", buscamos los dueños que tengan mascotas de esa especie
      if (category !== "Todos") {
        let speciesQuery = category;
        const { data: petsData } = await supabase
          .from("pets")
          .select("owner_id")
          .ilike("species", `%${speciesQuery}%`);

        if (petsData) {
          allowedOwnerIds = petsData.map((p) => p.owner_id);
        }
      }

      let postsQuery = supabase
        .from("posts")
        .select("id, image_url, likes")
        .order("created_at", { ascending: false })
        .limit(20);

      // Si hay filtros de categorias
      if (allowedOwnerIds !== null) {
        if (allowedOwnerIds.length > 0) {
          postsQuery = postsQuery.in("author_id", allowedOwnerIds);
        } else {
          // Si no hay dueños con esas mascotas, devolvemos vacio
          setExplorePosts([]);
          setLoadingPosts(false);
          return;
        }
      }

      const { data: postsData } = await postsQuery;

      if (postsData) {
        setExplorePosts(
          postsData.map((p, i) => ({
            ...p,
            height: 200 + Math.random() * 80, // Altura aleatoria para masonry
          })),
        );
      }
    } catch (err) {
      console.warn("Error cargando explore posts:", err);
    } finally {
      setLoadingPosts(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchExploreData();
    }, []),
  );

  const handleCategoryPress = (category: string) => {
    setActiveCategory(category);
    fetchPostsForCategory(category, searchQuery);
  };

  const handleFollow = async (accountId: string) => {
    if (!currentUserId) return;
    const isFollowing = followingMap[accountId];

    try {
      // Optimistic update
      setFollowingMap((prev) => ({ ...prev, [accountId]: !isFollowing }));

      if (isFollowing) {
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", currentUserId)
          .eq("following_id", accountId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("follows")
          .insert({ follower_id: currentUserId, following_id: accountId });
        if (error) throw error;
      }

      // Remove from suggested if we just started following them
      if (!isFollowing) {
        setSuggestedAccounts((prev) =>
          prev.filter((acc) => acc.id !== accountId),
        );
      }
    } catch (e) {
      console.warn("Error following", e);
      // Revert
      setFollowingMap((prev) => ({ ...prev, [accountId]: isFollowing }));
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <Animated.View entering={FadeInUp.duration(400)} style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatarContainer}>
              <Image
                source={{
                  uri:
                    currentUserAvatar ||
                    "https://ui-avatars.com/api/?name=User&background=F0EBE1&color=8A5A19",
                }}
                style={styles.avatar}
              />
            </View>
            <Text style={styles.headerTitle}>Explorar</Text>
          </View>
          <TouchableOpacity style={styles.notificationBtn}>
            <FontAwesome5 name="bell" size={22} color="#8A5A19" solid />
          </TouchableOpacity>
        </Animated.View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Search Bar */}
          <Animated.View
            entering={FadeInUp.delay(100).duration(400)}
            style={styles.searchContainer}
          >
            <FontAwesome5
              name="search"
              size={18}
              color="#8A5A19"
              style={styles.searchIcon}
            />
            <TextInput
              style={[
                styles.searchInput,
                Platform.OS === "web" && ({ outlineStyle: "none" } as any),
              ]}
              placeholder="Busca mascotas o amigos..."
              placeholderTextColor="#B08D6A"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={() =>
                fetchPostsForCategory(activeCategory, searchQuery)
              }
            />
          </Animated.View>

          {/* Categories */}
          <Animated.View entering={FadeInUp.delay(200).duration(400)}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesContainer}
            >
              {CATEGORIES.map((category, index) => {
                const isActive = activeCategory === category;
                return (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryChip,
                      isActive && styles.categoryChipActive,
                    ]}
                    onPress={() => handleCategoryPress(category)}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        isActive && styles.categoryTextActive,
                      ]}
                    >
                      {category}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Animated.View>

          {/* Suggested Accounts */}
          <Animated.View
            entering={FadeInUp.delay(300).duration(500)}
            style={styles.sectionContainer}
          >
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Cuentas sugeridas</Text>
            </View>

            {loadingAccounts ? (
              <ActivityIndicator
                size="small"
                color="#8A5A19"
                style={{ marginVertical: 20 }}
              />
            ) : suggestedAccounts.length === 0 ? (
              <Text
                style={{ textAlign: "center", color: "#A07E5B", padding: 20 }}
              >
                No hay nuevas sugerencias.
              </Text>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.suggestedContainer}
              >
                {suggestedAccounts.map((account) => (
                  <View key={account.id} style={styles.suggestedCard}>
                    <View style={styles.suggestedImageContainer}>
                      <Image
                        source={{ uri: account.image }}
                        style={styles.suggestedImage}
                      />
                    </View>
                    <Text style={styles.suggestedName} numberOfLines={1}>
                      {account.name}
                    </Text>
                    <Text style={styles.suggestedBreed} numberOfLines={1}>
                      {account.breed}
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.followBtn,
                        followingMap[account.id]
                          ? { backgroundColor: "#D1C4A5" }
                          : {},
                      ]}
                      onPress={() => handleFollow(account.id)}
                    >
                      <Text
                        style={[
                          styles.followBtnText,
                          followingMap[account.id] ? { color: "#4A2A14" } : {},
                        ]}
                      >
                        {followingMap[account.id] ? "Siguiendo" : "Seguir"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
          </Animated.View>

          {/* Explore Community Grid */}
          <Animated.View
            entering={FadeInUp.delay(400).duration(500)}
            style={styles.sectionContainer}
          >
            <Text
              style={[
                styles.sectionTitle,
                { marginLeft: 20, marginBottom: 15 },
              ]}
            >
              Explorar comunidad
            </Text>

            {loadingPosts ? (
              <ActivityIndicator
                size="small"
                color="#8A5A19"
                style={{ marginVertical: 20 }}
              />
            ) : (
              <View style={styles.masonryContainer}>
                {/* Left Column */}
                <View style={styles.masonryColumn}>
                  {explorePosts
                    .filter((_, i) => i % 2 === 0)
                    .map((post) => (
                      <View
                        key={post.id}
                        style={[styles.masonryItem, { height: post.height }]}
                      >
                        <Image
                          source={{ uri: post.image_url }}
                          style={styles.masonryImage}
                        />
                        <View style={styles.likeOverlay}>
                          <FontAwesome5
                            name="heart"
                            size={12}
                            color="#FFF"
                            solid
                          />
                          <Text style={styles.likeText}>{post.likes || 0}</Text>
                        </View>
                      </View>
                    ))}
                </View>

                {/* Right Column */}
                <View style={styles.masonryColumn}>
                  {explorePosts
                    .filter((_, i) => i % 2 !== 0)
                    .map((post) => (
                      <View
                        key={post.id}
                        style={[styles.masonryItem, { height: post.height }]}
                      >
                        <Image
                          source={{ uri: post.image_url }}
                          style={styles.masonryImage}
                        />
                        <View style={styles.likeOverlay}>
                          <FontAwesome5
                            name="heart"
                            size={12}
                            color="#FFF"
                            solid
                          />
                          <Text style={styles.likeText}>{post.likes || 0}</Text>
                        </View>
                      </View>
                    ))}
                </View>
              </View>
            )}
          </Animated.View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FAF7F2",
    paddingTop: Platform.OS === "android" ? 30 : 0,
  },
  container: {
    flex: 1,
    backgroundColor: "#FAF7F2",
  },
  scrollContent: {
    paddingBottom: 110, // Tab bar padding
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F0EBE1",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    overflow: "hidden",
  },
  avatar: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#8A5A19",
  },
  notificationBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FCECD9",
    marginHorizontal: 20,
    borderRadius: 25,
    paddingHorizontal: 15,
    marginBottom: 20,
    height: 50,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    color: "#4A2A14",
    fontSize: 16,
    fontWeight: "500",
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    gap: 10,
    paddingBottom: 25,
  },
  categoryChip: {
    backgroundColor: "#FFF8F0",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  categoryChipActive: {
    backgroundColor: "#8A5A19",
  },
  categoryText: {
    color: "#8A5A19",
    fontWeight: "600",
    fontSize: 14,
  },
  categoryTextActive: {
    color: "#FFFFFF",
  },
  sectionContainer: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#3E2100",
  },
  suggestedContainer: {
    paddingHorizontal: 20,
    gap: 15,
    paddingBottom: 10,
  },
  suggestedCard: {
    width: 150,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    elevation: 3,
  },
  suggestedImageContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: "#FFB05E",
    padding: 2,
    marginBottom: 10,
  },
  suggestedImage: {
    width: "100%",
    height: "100%",
    borderRadius: 35,
    resizeMode: "cover",
  },
  suggestedName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#4A2A14",
    marginBottom: 2,
  },
  suggestedBreed: {
    fontSize: 12,
    color: "#A07E5B",
    marginBottom: 15,
  },
  followBtn: {
    backgroundColor: "#8A5A19",
    width: "100%",
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: "center",
  },
  followBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
  },
  masonryContainer: {
    flexDirection: "row",
    paddingHorizontal: 15,
    gap: 15,
  },
  masonryColumn: {
    flex: 1,
    gap: 15,
  },
  masonryItem: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#EEE",
  },
  masonryImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  likeOverlay: {
    position: "absolute",
    bottom: 10,
    left: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0,0,0,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  likeText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "700",
  },
});
