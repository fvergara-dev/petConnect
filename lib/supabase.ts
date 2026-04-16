import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";
import "react-native-url-polyfill/auto";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

// Almacenamiento en memoria temporal para esquivar el crash del Native Module nulo
const memoryStorage = new Map<string, string>();

const storage =
  Platform.OS === "web"
    ? {
        getItem: (key: string) => {
          if (typeof window !== "undefined") {
            return Promise.resolve(localStorage.getItem(key));
          }
          return Promise.resolve(null);
        },
        setItem: (key: string, value: string) => {
          if (typeof window !== "undefined") {
            localStorage.setItem(key, value);
          }
          return Promise.resolve();
        },
        removeItem: (key: string) => {
          if (typeof window !== "undefined") {
            localStorage.removeItem(key);
          }
          return Promise.resolve();
        },
      }
    : {
        getItem: (key: string) =>
          Promise.resolve(memoryStorage.get(key) || null),
        setItem: (key: string, value: string) => {
          memoryStorage.set(key, value);
          return Promise.resolve();
        },
        removeItem: (key: string) => {
          memoryStorage.delete(key);
          return Promise.resolve();
        },
      };

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: storage as any,
    autoRefreshToken: false,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Tells Supabase Auth to continuously refresh the session automatically
// if the app is in the foreground. When this is added, you will continue
// to receive `onAuthStateChange` events with the `TOKEN_REFRESHED` or
// `SIGNED_OUT` event if the user's session is terminated. This should
// only be registered once.
// AppState.addEventListener("change", (state) => {
//   if (state === "active") {
//     supabase.auth.startAutoRefresh();
//   } else {
//     supabase.auth.stopAutoRefresh();
//   }
// });
