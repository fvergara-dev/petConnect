import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";
import { supabase } from "../lib/supabase";

export const unstable_settings = {
  initialRouteName: "index",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!isMounted) return;

      const inAuthGroup = segments[0] === "(tabs)";
      // Solo hacer el chequeo si el enrutador ya montó los segmentos iniciales
      if (segments.length === 0) return;

      if (!session && inAuthGroup) {
        // Redirigir al login si no tiene sesión pero intenta entrar a (tabs)
        router.replace("/login");
      } else if (
        session &&
        (segments[0] === "login" || segments[0] === "register")
      ) {
        // Redirigir al feed si ya tiene sesión activa
        router.replace("/(tabs)");
      }
    };

    checkAuth();

    let timeoutId: NodeJS.Timeout | null = null;
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!isMounted) return;

        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        // Si existe una sesión activa, programar un cierre forzado después de 1 hora exacta (3600000 ms)
        if (session) {
          timeoutId = setTimeout(async () => {
            await supabase.auth.signOut();
          }, 3600000);
        }

        const inAuthGroup = segments[0] === "(tabs)";

        if (
          session &&
          (segments[0] === "login" || segments[0] === "register")
        ) {
          router.replace("/(tabs)");
        } else if (!session && inAuthGroup) {
          router.replace("/login");
        }
      },
    );

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      authListener.subscription.unsubscribe();
    };
  }, [segments, router]);

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
