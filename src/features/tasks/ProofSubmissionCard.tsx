import { useRef, useState } from "react";
import { Alert, Image, StyleSheet, TextInput, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";

import { AppText } from "@/shared/components/AppText";
import { Button } from "@/shared/components/Button";
import { Card } from "@/shared/components/Card";
import { colors, spacing } from "@/shared/theme";

type ProofSubmissionCardProps = {
  initialNote?: string;
  onSubmit: (input: { note: string; photoUrl: string | null }) => void;
};

export function ProofSubmissionCard({ initialNote = "", onSubmit }: ProofSubmissionCardProps) {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [note, setNote] = useState(initialNote);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  async function openCamera() {
    const currentPermission = permission?.granted ? permission : await requestPermission();

    if (!currentPermission.granted) {
      Alert.alert("Camera permission needed", "Camera access is required to take a live proof photo.");
      return;
    }

    const isAvailable = await CameraView.isAvailableAsync();

    if (!isAvailable) {
      await captureFallbackPhoto();
      return;
    }

    setIsCameraOpen(true);
  }

  async function takePhoto() {
    const photo = await cameraRef.current?.takePictureAsync({
      quality: 0.75
    });

    if (photo?.uri) {
      setPhotoUrl(photo.uri);
      setIsCameraOpen(false);
    }
  }

  async function captureFallbackPhoto() {
    Alert.alert("Camera unavailable", "Use a proof photo from this device for now.");
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.75
    });

    if (!result.canceled) {
      setPhotoUrl(result.assets[0]?.uri ?? null);
      setIsCameraOpen(false);
    }
  }

  return (
    <Card>
      <AppText variant="body">Proof</AppText>

      {isCameraOpen ? (
        <View style={styles.cameraBlock}>
          <CameraView ref={cameraRef} facing="back" style={styles.camera} />
          <View style={styles.actions}>
            <Button label="Cancel" onPress={() => setIsCameraOpen(false)} variant="quiet" />
            <Button icon="camera" label="Take photo" onPress={takePhoto} />
          </View>
        </View>
      ) : null}

      {photoUrl && !isCameraOpen ? <Image source={{ uri: photoUrl }} style={styles.preview} /> : null}

      <TextInput
        multiline
        onChangeText={setNote}
        placeholder="Add a quick note"
        placeholderTextColor={colors.inkMuted}
        style={styles.noteInput}
        value={note}
      />

      {!isCameraOpen ? (
        <View style={styles.actions}>
          <Button
            icon={photoUrl ? "refresh" : "camera"}
            label={photoUrl ? "Retake live proof photo" : "Take live proof photo"}
            onPress={openCamera}
            variant="secondary"
          />
          <Button
            disabled={!photoUrl}
            icon="sparkles"
            label="Submit for review"
            onPress={() => {
              onSubmit({ note, photoUrl });
              setNote("");
              setPhotoUrl(null);
            }}
          />
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: spacing.sm
  },
  camera: {
    aspectRatio: 4 / 3,
    borderRadius: 8,
    overflow: "hidden",
    width: "100%"
  },
  cameraBlock: {
    gap: spacing.sm
  },
  noteInput: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 16,
    minHeight: 84,
    padding: spacing.md,
    textAlignVertical: "top"
  },
  preview: {
    aspectRatio: 4 / 3,
    borderRadius: 8,
    width: "100%"
  }
});
