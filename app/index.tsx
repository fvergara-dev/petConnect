import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../lib/supabase";

export default function RootIndex() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace("/(tabs)");
      } else {
        router.replace("/login");
      }
    };
    checkAuth();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: "#FAF7F2", justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" color="#8A5A19" />
    </View>
  );
}
