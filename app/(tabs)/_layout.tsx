import { useThemeColor } from "@/hooks/use-theme-color";
import { FontAwesome5 } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";

export default function TabLayout() {
  const backgroundColor = useThemeColor({}, "background");
  const tintColor = useThemeColor({}, "tint");
  const backgroundColorSelected = useThemeColor({}, "button");
  const iconColorUnselected = useThemeColor({}, "tabIconDefault");
  const iconColorSelected = useThemeColor({}, "buttonText");

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: [styles.tabBar, { backgroundColor }],
        tabBarShowLabel: false,

        // --- LA SOLUCIÓN DEFINITIVA A LA SUPERPOSICIÓN VIRTUAL ---
        // 1. Elimina el padding invisible que reserva React Navigation para la SafeArea y el texto label
        tabBarItemStyle: {
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        },
        // 2. Fuerzo a que el ícono consuma su contenedor y borro el empuje default hacia arriba
        tabBarIconStyle: {
          flex: 1,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <View
              style={[
                styles.iconContainer,
                focused && { backgroundColor: backgroundColorSelected },
              ]}
            >
              <FontAwesome5
                name="home"
                size={22}
                color={focused ? iconColorSelected : iconColorUnselected}
                solid={focused}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          tabBarIcon: ({ focused }) => (
            <View
              style={[
                styles.iconContainer,
                focused && { backgroundColor: backgroundColorSelected },
              ]}
            >
              <FontAwesome5
                name="search"
                size={20}
                color={focused ? iconColorSelected : iconColorUnselected}
                solid={focused}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="new"
        options={{
          tabBarIcon: ({ focused }) => (
            <View
              style={[
                styles.iconContainer,
                focused && { backgroundColor: backgroundColorSelected },
              ]}
            >
              <FontAwesome5
                name="plus-square"
                size={22}
                color={focused ? iconColorSelected : iconColorUnselected}
                solid={focused}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          tabBarIcon: ({ focused }) => (
            <View
              style={[
                styles.iconContainer,
                focused && { backgroundColor: backgroundColorSelected },
              ]}
            >
              <FontAwesome5
                name="bell"
                size={20}
                color={focused ? iconColorSelected : iconColorUnselected}
                solid={focused}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <View
              style={[
                styles.iconContainer,
                focused && { backgroundColor: backgroundColorSelected },
              ]}
            >
              <FontAwesome5
                name="user-alt"
                size={20}
                color={focused ? iconColorSelected : iconColorUnselected}
                solid={focused}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 25 : 20,
    left: 20,
    right: 20,
    height: 65,
    borderRadius: 35,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderTopWidth: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    margin: 0,
    padding: 0,
  },
});
