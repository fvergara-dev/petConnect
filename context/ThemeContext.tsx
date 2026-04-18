import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useColorScheme as useReactNativeColorScheme } from "react-native";

type ThemeType = "light" | "dark" | "system";

interface ThemeContextProps {
  theme: "light" | "dark";
  themeMode: ThemeType;
  setThemeMode: (mode: ThemeType) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextProps>({
  theme: "light",
  themeMode: "system",
  setThemeMode: () => {},
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemColorScheme = useReactNativeColorScheme();
  const [themeMode, setThemeMode] = useState<ThemeType>("system");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedMode = await AsyncStorage.getItem("themeMode");
        if (
          savedMode === "light" ||
          savedMode === "dark" ||
          savedMode === "system"
        ) {
          setThemeMode(savedMode);
        }
      } catch (e) {
        console.error("Failed to load theme mode", e);
      } finally {
        setIsLoaded(true);
      }
    };
    loadTheme();
  }, []);

  const changeThemeMode = async (mode: ThemeType) => {
    setThemeMode(mode);
    try {
      await AsyncStorage.setItem("themeMode", mode);
    } catch (e) {
      console.error("Failed to save theme mode", e);
    }
  };

  const resolvedTheme =
    themeMode === "system" ? systemColorScheme || "light" : themeMode;

  const toggleTheme = () => {
    const nextTheme = resolvedTheme === "light" ? "dark" : "light";
    changeThemeMode(nextTheme);
  };

  if (!isLoaded) return null;

  return (
    <ThemeContext.Provider
      value={{
        theme: resolvedTheme,
        themeMode,
        setThemeMode: changeThemeMode,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
