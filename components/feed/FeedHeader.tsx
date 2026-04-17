import { FontAwesome5 } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { supabase } from "../../lib/supabase";

export default function FeedHeader() {
  const router = useRouter();
  const [avatar, setAvatar] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const fetchAvatar = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !isMounted) return;
      const { data } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", user.id)
        .single();

      if (data?.avatar_url && isMounted) {
        setAvatar(data.avatar_url);
      }
    };
    fetchAvatar();
    return () => {
      isMounted = false;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      let userId: string | null = null;
      let subscription: any = null;

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

        // Suscribirse a nuevas notificaciones en tiempo real
        if (isMounted) {
          subscription = supabase
            .channel(`public:notifications:user_id=eq.${user.id}`)
            .on(
              "postgres_changes",
              {
                event: "INSERT",
                schema: "public",
                table: "notifications",
                filter: `user_id=eq.${user.id}`,
              },
              () => {
                if (isMounted) {
                  setUnreadCount((prev) => prev + 1);
                }
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

  return (
    <View style={styles.headerContainer}>
      <View style={styles.leftGroup}>
        <Image
          source={{
            uri:
              avatar ||
              "https://ui-avatars.com/api/?name=User&background=F0EBE1&color=8A5A19",
          }}
          style={styles.avatar}
        />
        <Text style={styles.headerTitle}>PetConnect</Text>
      </View>
      <TouchableOpacity
        style={styles.notificationBtn}
        onPress={() => router.push("/(tabs)/notifications")}
      >
        <FontAwesome5 name="bell" size={22} color="#4A2A14" solid />
        {unreadCount > 0 && <View style={styles.badge} />}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#FAF7F2",
  },
  leftGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#4A2A14",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#4A2A14",
  },
  notificationBtn: {
    position: "relative",
    padding: 5,
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
});
