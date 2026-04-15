import { Tabs } from "expo-router";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";

import { FontAwesome5 } from "@expo/vector-icons";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <View
              style={[styles.iconContainer, focused && styles.activeBackground]}
            >
              <FontAwesome5
                name="home"
                size={22}
                color={focused ? "#FFFFFF" : "#8A5A19"}
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
              style={[styles.iconContainer, focused && styles.activeBackground]}
            >
              <FontAwesome5
                name="search"
                size={20}
                color={focused ? "#FFFFFF" : "#8A5A19"}
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
              style={[styles.iconContainer, focused && styles.activeBackground]}
            >
              <FontAwesome5
                name="plus-square"
                size={22}
                color={focused ? "#FFFFFF" : "#8A5A19"}
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
              style={[styles.iconContainer, focused && styles.activeBackground]}
            >
              <FontAwesome5
                name="user-alt"
                size={20}
                color={focused ? "#FFFFFF" : "#8A5A19"}
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
    backgroundColor: "#FAF7F2",
    borderRadius: 35,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 0,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  activeBackground: {
    backgroundColor: "#8A5A19",
  },
});
