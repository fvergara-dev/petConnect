import { FontAwesome5 } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { supabase } from "../../lib/supabase";

export default function FeedHeader() {
  const [avatar, setAvatar] = useState<string | null>(null);

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
      <TouchableOpacity style={styles.notificationBtn}>
        <FontAwesome5 name="bell" size={22} color="#4A2A14" solid />
        <View style={styles.badge} />
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
    borderWidth: 2,
    borderColor: "#4A2A14", // Match the brown outline from design
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
