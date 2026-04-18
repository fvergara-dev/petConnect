import { useThemeColor } from "@/hooks/use-theme-color";
import { FontAwesome5 } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
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
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestedAccounts, setSuggestedAccounts] = useState<any[]>([]);
  const [explorePosts, setExplorePosts] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string | null>(
    null,
  );

  const backgroundColor = useThemeColor({}, "background");
  const tintColor = useThemeColor({}, "tint");
  const textColor = useThemeColor({}, "text");
  const cardColor = useThemeColor({}, "card");
  const iconColor = useThemeColor({}, "icon");

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

  const handleSearchQuery = async (query: string) => {
    setLoadingAccounts(true);
    setLoadingPosts(true);

    try {
      // 1. Buscar perfiles (nombre o username)
      const { data: matchedProfiles } = await supabase
        .from("profiles")
        .select("id")
        .or(`full_name.ilike.%${query}%,username.ilike.%${query}%`);

      // 2. Buscar mascotas (nombre o raza o especie)
      const { data: matchedPets } = await supabase
        .from("pets")
        .select("owner_id")
        .or(
          `name.ilike.%${query}%,breed.ilike.%${query}%,species.ilike.%${query}%`,
        );

      const profileIds = new Set<string>();
      if (matchedProfiles) matchedProfiles.forEach((p) => profileIds.add(p.id));
      if (matchedPets) matchedPets.forEach((p) => profileIds.add(p.owner_id));

      const matchedUserIds = Array.from(profileIds);

      if (matchedUserIds.length === 0) {
        setSuggestedAccounts([]);
        setExplorePosts([]);
        setLoadingAccounts(false);
        setLoadingPosts(false);
        return;
      }

      // Si el usuario actual está en la búsqueda, podemos incluirlo o no (decidimos no mostrarlo en accounts, pero sí en posts)
      const filteredAccountIds = currentUserId
        ? matchedUserIds.filter((id) => id !== currentUserId)
        : matchedUserIds;

      // Obtener perfiles para "Cuentas sugeridas" de los resultados de búsqueda
      if (filteredAccountIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("*")
          .in("id", filteredAccountIds)
          .limit(10);

        if (profilesData) {
          const suggested = [];
          for (const profile of profilesData) {
            const { data: pets } = await supabase
              .from("pets")
              .select("name, breed, species")
              .eq("owner_id", profile.id)
              .limit(1);

            const petData = pets && pets.length > 0 ? pets[0] : null;

            suggested.push({
              id: profile.id,
              name: profile.full_name || profile.username || "Usuario",
              breed: petData
                ? `${petData.name ? petData.name + " - " : ""}${petData.breed || petData.species || ""}`
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
      } else {
        setSuggestedAccounts([]);
      }

      // Obtener posts para esos mismos usuarios en la sección "Explorar comunidad"
      const { data: postsData } = await supabase
        .from("posts")
        .select("id, image_url, likes")
        .in("author_id", matchedUserIds)
        .order("created_at", { ascending: false })
        .limit(20);

      if (postsData) {
        setExplorePosts(
          postsData.map((p, i) => ({
            ...p,
            height: 200 + Math.random() * 80, // Mantener masonry
          })),
        );
      } else {
        setExplorePosts([]);
      }
    } catch (err) {
      console.warn("Error en la búsqueda:", err);
    } finally {
      setLoadingAccounts(false);
      setLoadingPosts(false);
    }
  };

  const fetchPostsForCategory = async (category: string, search: string) => {
    if (search.trim() !== "") {
      // Si hay una búsqueda de texto, redirigimos la lógica a la búsqueda completa
      handleSearchQuery(search);
      return;
    }

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

      let isMounted = true;
      let subscription: any = null;

      const fetchUnread = async () => {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user || !isMounted) return;

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
            .channel(`explore:notifications:${user.id}`)
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
        if (subscription) {
          supabase.removeChannel(subscription);
        }
      };
    }, []),
  );

  const handleCategoryPress = (category: string) => {
    setActiveCategory(category);
    // Si hay una búsqueda activa, mejor limpiarla para ver la categoría real
    if (searchQuery.trim() !== "") {
      setSearchQuery("");
      fetchPostsForCategory(category, "");
    } else {
      fetchPostsForCategory(category, searchQuery);
    }
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

        // Insertar la notificacion de follow:
        if (currentUserId !== accountId) {
          const { error: notifError } = await supabase
            .from("notifications")
            .insert({
              user_id: accountId,
              actor_id: currentUserId,
              type: "follow",
            });
          if (notifError)
            console.error(
              "Error trigger explore follow notification:",
              notifError,
            );
        }
      }
    } catch (e) {
      console.warn("Error following", e);
      // Revert
      setFollowingMap((prev) => ({ ...prev, [accountId]: isFollowing }));
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
      <View style={[styles.container, { backgroundColor }]}>
        {/* Header */}
        <Animated.View entering={FadeInUp.duration(400)} style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.avatarContainer, { borderColor: tintColor }]}>
              <Image
                source={{
                  uri:
                    currentUserAvatar ||
                    "https://ui-avatars.com/api/?name=User&background=F0EBE1&color=8A5A19",
                }}
                style={styles.avatar}
              />
            </View>
            <Text style={[styles.headerTitle, { color: textColor }]}>
              Explorar
            </Text>
          </View>
          <TouchableOpacity
            style={styles.notificationBtn}
            onPress={() => router.push("/(tabs)/notifications")}
          >
            <FontAwesome5 name="bell" size={22} color={iconColor} solid />
            {unreadCount > 0 && (
              <View style={[styles.badge, { borderColor: backgroundColor }]} />
            )}
          </TouchableOpacity>
        </Animated.View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Search Bar */}
          <Animated.View
            entering={FadeInUp.delay(100).duration(400)}
            style={[
              styles.searchContainer,
              { backgroundColor: cardColor, borderColor: tintColor + "40" },
            ]}
          >
            <FontAwesome5
              name="search"
              size={18}
              color={iconColor}
              style={styles.searchIcon}
            />
            <TextInput
              style={[
                styles.searchInput,
                { color: textColor },
                Platform.OS === "web" && ({ outlineStyle: "none" } as any),
              ]}
              placeholder="Busca mascotas o amigos..."
              placeholderTextColor={iconColor}
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                if (text.trim() === "") {
                  // Volver al estado inicial si se borra el texto
                  fetchExploreData();
                }
              }}
              onSubmitEditing={() => {
                if (searchQuery.trim() !== "") {
                  handleSearchQuery(searchQuery);
                } else {
                  fetchExploreData();
                }
              }}
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
                      {
                        backgroundColor: cardColor,
                        borderColor: tintColor + "40",
                      },
                      isActive && { backgroundColor: tintColor },
                    ]}
                    onPress={() => handleCategoryPress(category)}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        { color: textColor },
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
              <Text style={[styles.sectionTitle, { color: textColor }]}>
                Cuentas sugeridas
              </Text>
            </View>

            {loadingAccounts ? (
              <ActivityIndicator
                size="small"
                color={tintColor}
                style={{ marginVertical: 20 }}
              />
            ) : suggestedAccounts.length === 0 ? (
              <Text
                style={{
                  textAlign: "center",
                  color: textColor,
                  padding: 20,
                  opacity: 0.7,
                }}
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
                  <View
                    key={account.id}
                    style={[
                      styles.suggestedCard,
                      { backgroundColor: cardColor },
                    ]}
                  >
                    <View
                      style={[
                        styles.suggestedImageContainer,
                        { borderColor: tintColor },
                      ]}
                    >
                      <Image
                        source={{ uri: account.image }}
                        style={styles.suggestedImage}
                      />
                    </View>
                    <Text
                      style={[styles.suggestedName, { color: textColor }]}
                      numberOfLines={1}
                    >
                      {account.name}
                    </Text>
                    <Text
                      style={[styles.suggestedBreed, { color: iconColor }]}
                      numberOfLines={1}
                    >
                      {account.breed}
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.followBtn,
                        { backgroundColor: tintColor },
                        followingMap[account.id]
                          ? { backgroundColor: backgroundColor }
                          : {},
                      ]}
                      onPress={() => handleFollow(account.id)}
                    >
                      <Text
                        style={[
                          styles.followBtnText,
                          { color: "#fff" }, // Keep text white inside tinted buttons
                          followingMap[account.id] ? { color: textColor } : {},
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
                { marginLeft: 20, marginBottom: 15, color: textColor },
              ]}
            >
              Explorar comunidad
            </Text>

            {loadingPosts ? (
              <ActivityIndicator
                size="small"
                color={tintColor}
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
    paddingTop: Platform.OS === "android" ? 30 : 0,
  },
  container: {
    flex: 1,
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
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    overflow: "hidden",
    borderWidth: 1,
  },
  avatar: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
  },
  notificationBtn: {
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
    backgroundColor: "#C84D3B",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    borderRadius: 25,
    paddingHorizontal: 15,
    marginBottom: 20,
    height: 50,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    fontSize: 16,
    fontWeight: "500",
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    gap: 10,
    paddingBottom: 25,
  },
  categoryChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  categoryChipActive: {},
  categoryText: {
    fontWeight: "600",
    fontSize: 14,
  },
  categoryTextActive: {},
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
  },
  suggestedContainer: {
    paddingHorizontal: 20,
    gap: 15,
    paddingBottom: 10,
  },
  suggestedCard: {
    width: 150,
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
    marginBottom: 2,
  },
  suggestedBreed: {
    fontSize: 12,
    marginBottom: 15,
  },
  followBtn: {
    width: "100%",
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: "center",
  },
  followBtnText: {
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
