import { useThemeColor } from "@/hooks/use-theme-color";
import React from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const mockStories = [
  {
    id: "1",
    name: "Luna",
    image:
      "https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=150",
  },
  {
    id: "2",
    name: "Cooper",
    image:
      "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=150",
  },
  {
    id: "3",
    name: "Mochi",
    image:
      "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=150",
  },
  {
    id: "4",
    name: "Leo",
    image:
      "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=150",
  },
];

export default function Stories() {
  const cardColor = useThemeColor({}, "card");
  const textColor = useThemeColor({}, "text");
  const tintColor = useThemeColor({}, "tint");

  return (
    <View style={[styles.storiesContainer, { backgroundColor: cardColor }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {mockStories.map((story) => (
          <TouchableOpacity key={story.id} style={styles.storyWrap}>
            <View style={[styles.ring, { borderColor: tintColor }]}>
              <View style={[styles.imageWrap, { borderColor: cardColor }]}>
                <Image
                  source={{ uri: story.image }}
                  style={styles.storyImage}
                />
              </View>
            </View>
            <Text style={[styles.storyName, { color: textColor }]}>
              {story.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  storiesContainer: {
    paddingVertical: 10,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 15,
  },
  storyWrap: {
    alignItems: "center",
  },
  ring: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  imageWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 2,
  },
  storyImage: {
    width: "100%",
    height: "100%",
  },
  storyName: {
    fontSize: 12,
    fontWeight: "700",
  },
});
