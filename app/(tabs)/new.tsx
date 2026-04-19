import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import { decode } from "base64-arraybuffer";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useThemeColor } from "../../hooks/use-theme-color";
import { supabase } from "../../lib/supabase";

const COLORS = {
  // kept only for reference if needed, ideally can remove
};

export default function NewPostScreen() {
  const router = useRouter();
  const [caption, setCaption] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [base64, setBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [genericAlert, setGenericAlert] = useState<{
    title: string;
    message: string;
  } | null>(null);

  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const tintColor = useThemeColor({}, "tint");
  const cardColor = useThemeColor({}, "card");
  const iconColor = useThemeColor({}, "icon");
  const borderColor = useThemeColor({}, "border");

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 5],
      quality: 1, // We get max quality, then compress
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri;

      // Resizing & Compression step
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1080 } }], // Resize down to reasonable app constraint
        {
          compress: 0.7,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true,
        },
      );

      setImage(manipResult.uri);
      setBase64(manipResult.base64 || null);
    }
  };

  const removeImage = () => {
    setImage(null);
    setBase64(null);
  };

  const handlePost = async () => {
    if (!caption.trim() && !image) {
      setGenericAlert({
        title: "Error",
        message: "Debes agregar una foto o escribir algo para tu post",
      });
      return;
    }

    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("No hay usuario autenticado.");

      let publicUrl = null;

      if (image && base64) {
        const filePath = `${user.id}/${new Date().getTime()}.png`;
        const { error: uploadError } = await supabase.storage
          .from("posts")
          .upload(filePath, decode(base64), {
            contentType: "image/png",
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from("posts").getPublicUrl(filePath);
        publicUrl = data.publicUrl;
      }

      const { error: insertError } = await supabase.from("posts").insert([
        {
          author_id: user.id,
          content: caption.trim() || null,
          image_url: publicUrl,
        },
      ]);

      if (insertError) throw insertError;

      setCaption("");
      removeImage();
      router.replace("/(tabs)");
    } catch (error: any) {
      setGenericAlert({
        title: "Error al crear post",
        message: error.message || "Ocurrió un error inesperado.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={[styles.header, { borderBottomColor: borderColor }]}>
          <Text style={[styles.headerTitle, { color: textColor }]}>
            Nuevo Post
          </Text>
          <TouchableOpacity
            style={[
              styles.postButton,
              { backgroundColor: tintColor },
              !caption.trim() && !image && { backgroundColor: cardColor },
            ]}
            disabled={(!caption.trim() && !image) || loading}
            onPress={handlePost}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={[styles.postButtonText, { color: backgroundColor }]}>
                Publicar
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <TextInput
            style={[styles.textInput, { color: textColor }]}
            placeholder="¿Qué hizo tu mascota hoy?"
            placeholderTextColor={iconColor}
            multiline
            maxLength={300}
            value={caption}
            onChangeText={setCaption}
          />

          {image ? (
            <View style={styles.imagePreviewContainer}>
              <Image
                source={{ uri: image }}
                style={[styles.imagePreview, { backgroundColor: cardColor }]}
              />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={removeImage}
              >
                <MaterialIcons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.uploadButton,
                { backgroundColor: cardColor, borderColor: iconColor },
              ]}
              onPress={pickImage}
            >
              <FontAwesome5 name="images" size={32} color={tintColor} />
              <Text style={[styles.uploadButtonText, { color: tintColor }]}>
                Añadir foto / video
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
      {/* Generic Alert Modal */}
      {genericAlert && (
        <Modal transparent animationType="fade" visible={true}>
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalContentCentered,
                { backgroundColor: cardColor },
              ]}
            >
              <Text style={[styles.modalTitle, { color: textColor }]}>
                {genericAlert.title}
              </Text>
              <Text style={[styles.modalText, { color: textColor }]}>
                {genericAlert.message}
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: tintColor }]}
                  onPress={() => setGenericAlert(null)}
                >
                  <Text
                    style={[
                      styles.modalButtonTextPrimary,
                      { color: backgroundColor },
                    ]}
                  >
                    OK
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? 40 : 0,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  postButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  postButtonText: {
    fontWeight: "bold",
    fontSize: 16,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  textInput: {
    fontSize: 18,
    minHeight: 120,
    textAlignVertical: "top",
    marginBottom: 20,
  },
  uploadButton: {
    height: 180,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  uploadButtonText: {
    marginTop: 12,
    fontWeight: "600",
    fontSize: 16,
  },
  imagePreviewContainer: {
    position: "relative",
    width: "100%",
    aspectRatio: 4 / 5,
    borderRadius: 16,
    overflow: "hidden",
  },
  imagePreview: {
    width: "100%",
    height: "100%",
  },
  removeImageButton: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 8,
    borderRadius: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
  },
  modalContentCentered: {
    borderRadius: 24,
    margin: 24,
    padding: 24,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  modalText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 24,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
  },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 100,
    alignItems: "center",
  },
  modalButtonPrimary: {},
  modalButtonTextPrimary: {
    fontWeight: "bold",
    fontSize: 14,
  },
});
