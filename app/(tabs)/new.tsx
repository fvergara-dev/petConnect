import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import { decode } from "base64-arraybuffer";
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
import { supabase } from "../../lib/supabase";

const COLORS = {
  background: "#fff8f4",
  onSurface: "#482d00",
  primary: "#8c5100",
  onPrimary: "#fff7f4",
  surfaceContainerLow: "#fff1e4",
  surfaceContainer: "#ffebd4",
  onSurfaceVariant: "#7b5925",
  danger: "#aa371c",
  buttonBg: "#8A5A19",
  primaryText: "#4A2A14",
  secondaryText: "#7A6451",
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

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImage(result.assets[0].uri);
      setBase64(result.assets[0].base64 || null);
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
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Nuevo Post</Text>
          <TouchableOpacity
            style={[
              styles.postButton,
              !caption.trim() && !image && styles.postButtonDisabled,
            ]}
            disabled={(!caption.trim() && !image) || loading}
            onPress={handlePost}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.onPrimary} size="small" />
            ) : (
              <Text style={styles.postButtonText}>Publicar</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="¿Qué hizo tu mascota hoy?"
            placeholderTextColor={COLORS.onSurfaceVariant}
            multiline
            maxLength={300}
            value={caption}
            onChangeText={setCaption}
          />

          {image ? (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: image }} style={styles.imagePreview} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={removeImage}
              >
                <MaterialIcons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
              <FontAwesome5 name="images" size={32} color={COLORS.primary} />
              <Text style={styles.uploadButtonText}>Añadir foto / video</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
      {/* Generic Alert Modal */}
      {genericAlert && (
        <Modal transparent animationType="fade" visible={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContentCentered}>
              <Text style={styles.modalTitle}>{genericAlert.title}</Text>
              <Text style={styles.modalText}>{genericAlert.message}</Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonPrimary]}
                  onPress={() => setGenericAlert(null)}
                >
                  <Text style={styles.modalButtonTextPrimary}>OK</Text>
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
    backgroundColor: COLORS.background,
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
    borderBottomColor: COLORS.surfaceContainer,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.onSurface,
  },
  postButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  postButtonDisabled: {
    backgroundColor: COLORS.surfaceContainer,
  },
  postButtonText: {
    color: COLORS.onPrimary,
    fontWeight: "bold",
    fontSize: 16,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  textInput: {
    fontSize: 18,
    color: COLORS.onSurface,
    minHeight: 120,
    textAlignVertical: "top",
    marginBottom: 20,
  },
  uploadButton: {
    height: 180,
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.surfaceContainer,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  uploadButtonText: {
    marginTop: 12,
    color: COLORS.primary,
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
    backgroundColor: COLORS.surfaceContainer,
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
    backgroundColor: "#ffffff",
    borderRadius: 24,
    margin: 24,
    padding: 24,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.primaryText,
    marginBottom: 10,
    textAlign: "center",
  },
  modalText: {
    fontSize: 16,
    color: COLORS.secondaryText,
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
  modalButtonPrimary: {
    backgroundColor: COLORS.buttonBg,
  },
  modalButtonTextPrimary: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 14,
  },
});
