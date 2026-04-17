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
import { supabase } from "../../lib/supabase";

const COLORS = {
  background: "#FAF7F2",
  primaryText: "#4A2A14",
  secondaryText: "#7A6451",
  orangePrimary: "#FDB664",
  inputBg1: "#FEE0B8",
  buttonBg: "#8A5A19",
  linkBlue: "#165D8B",
  surface: "#fff8f4",
  surfaceVariant: "#ffddb3",
  surfaceContainerLowest: "#ffffff",
};

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
    let iconColor = COLORS.secondaryText;

    if (item.type === "like") {
      message = "le dio me gusta a tu publicación.";
      iconName = "heart";
      iconColor = "#e0245e";
    } else if (item.type === "comment") {
      message = "comentó tu publicación.";
      iconName = "comment";
      iconColor = COLORS.linkBlue;
    } else if (item.type === "follow") {
      message = "comenzó a seguirte.";
      iconName = "user-plus";
      iconColor = COLORS.buttonBg;
    }

    return (
      <View style={[styles.notificationCard, !item.read && styles.unreadCard]}>
        {actorData?.avatar_url ? (
          <Image source={{ uri: actorData.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <MaterialIcons name="person" size={24} color={COLORS.buttonBg} />
          </View>
        )}
        <View style={styles.textContainer}>
          <Text style={styles.notificationText}>
            <Text style={styles.actorName}>{actorName} </Text>
            {message}
          </Text>
          <Text style={styles.timeText}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
        <FontAwesome5 name={iconName} size={16} color={iconColor} solid />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notificaciones</Text>
      </View>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.buttonBg} />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No tienes notificaciones aún.</Text>
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
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === "android" ? 40 : 0,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 15,
    paddingTop: 10,
    backgroundColor: COLORS.background,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.primaryText,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    color: COLORS.secondaryText,
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
    backgroundColor: "#ffffff",
    borderRadius: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  unreadCard: {
    backgroundColor: COLORS.surfaceContainerLowest || "#FFF5E6",
    borderColor: COLORS.orangePrimary,
    borderWidth: 1,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    marginRight: 15,
  },
  avatarPlaceholder: {
    backgroundColor: COLORS.surfaceVariant,
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    flex: 1,
    marginRight: 10,
  },
  actorName: {
    fontWeight: "bold",
    color: COLORS.primaryText,
  },
  notificationText: {
    color: COLORS.primaryText,
    fontSize: 15,
    lineHeight: 20,
  },
  timeText: {
    color: COLORS.secondaryText,
    fontSize: 12,
    marginTop: 4,
  },
});
