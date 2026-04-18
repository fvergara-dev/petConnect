import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useThemeColor } from "../../hooks/use-theme-color";
import { supabase } from "../../lib/supabase";

const COLORS = {
  // kept reference for any leftovers
};

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const secondaryTextColor = useThemeColor({}, "secondaryText");
  const tintColor = useThemeColor({}, "tint");
  const cardColor = useThemeColor({}, "card");
  const borderColor = useThemeColor({}, "border");

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, []),
  );

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from("notifications")
        .select(
          `
          id,
          type,
          created_at,
          read,
          post_id,
          actor:profiles!actor_id(full_name, avatar_url)
        `,
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.warn("Error fetching notifications:", error.message);
      } else {
        setNotifications(data || []);
      }

      // Marcar como leidas
      await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  const renderNotification = ({ item }: { item: any }) => {
    // Cuando se hace un JOIN en Supabase, actor suele venir como objeto o array.
    const actorData = Array.isArray(item.actor) ? item.actor[0] : item.actor;
    const actorName = actorData?.full_name || "Alguien";

    let message = "";
    let iconName = "bell";
    let iconColor = secondaryTextColor;

    if (item.type === "like") {
      message = "le dio me gusta a tu publicación.";
      iconName = "heart";
      iconColor = "#e0245e";
    } else if (item.type === "comment") {
      message = "comentó tu publicación.";
      iconName = "comment";
      iconColor = "#165D8B"; // kept as original semantic color depending on intention, or we can use tintColor
    } else if (item.type === "follow") {
      message = "comenzó a seguirte.";
      iconName = "user-plus";
      iconColor = tintColor;
    }

    return (
      <View
        style={[
          styles.notificationCard,
          { backgroundColor: cardColor },
          !item.read && {
            backgroundColor: backgroundColor,
            borderColor: tintColor,
            borderWidth: 1,
          },
        ]}
      >
        {actorData?.avatar_url ? (
          <Image source={{ uri: actorData.avatar_url }} style={styles.avatar} />
        ) : (
          <View
            style={[
              styles.avatar,
              styles.avatarPlaceholder,
              { backgroundColor: borderColor },
            ]}
          >
            <MaterialIcons name="person" size={24} color={tintColor} />
          </View>
        )}
        <View style={styles.textContainer}>
          <Text style={[styles.notificationText, { color: textColor }]}>
            <Text style={[styles.actorName, { color: textColor }]}>
              {actorName}{" "}
            </Text>
            {message}
          </Text>
          <Text style={[styles.timeText, { color: secondaryTextColor }]}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
        <FontAwesome5 name={iconName} size={16} color={iconColor} solid />
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
      <View style={[styles.header, { backgroundColor }]}>
        <Text style={[styles.headerTitle, { color: textColor }]}>
          Notificaciones
        </Text>
      </View>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={tintColor} />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.center}>
          <Text style={[styles.emptyText, { color: secondaryTextColor }]}>
            No tienes notificaciones aún.
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderNotification}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? 40 : 0,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 15,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  notificationCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderRadius: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    marginRight: 15,
  },
  avatarPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    flex: 1,
    marginRight: 10,
  },
  actorName: {
    fontWeight: "bold",
  },
  notificationText: {
    fontSize: 15,
    lineHeight: 20,
  },
  timeText: {
    fontSize: 12,
    marginTop: 4,
  },
});
