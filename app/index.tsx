import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { supabase } from "../lib/supabase";
import {
  registerForPushNotificationsAsync,
  savePushTokenToSupabase,
} from "../utils/notifications";

import { useThemeColor } from "../hooks/use-theme-color";

export default function RootIndex() {
  const router = useRouter();
  const backgroundColor = useThemeColor({}, "background");
  const tintColor = useThemeColor({}, "tint");

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        // Push notification setup on successful login
        const token = await registerForPushNotificationsAsync();
        if (token) {
          await savePushTokenToSupabase(session.user.id, token);
        }

        router.replace("/(tabs)");
      } else {
        router.replace("/login");
      }
    };
    checkAuth();
  }, []);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: backgroundColor,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <ActivityIndicator size="large" color={tintColor} />
    </View>
  );
}
