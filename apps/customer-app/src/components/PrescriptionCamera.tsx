import { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import type { CameraType } from 'expo-camera';

interface PrescriptionCameraProps {
  onCapture: (imageUri: string) => void;
  onCancel: () => void;
}

export function PrescriptionCamera({ onCapture, onCancel }: PrescriptionCameraProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing] = useState<CameraType>('back');
  const cameraRef = useRef<CameraView>(null);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Camera access is needed to capture prescriptions.</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const capture = async () => {
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
    if (photo?.uri) onCapture(photo.uri);
  };

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
        <View style={styles.overlay}>
          <Text style={styles.hint}>Position the prescription within the frame</Text>
          <View style={styles.frame} />
          <View style={styles.controls}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.captureButton} onPress={capture}>
              <View style={styles.captureInner} />
            </TouchableOpacity>
            <View style={{ width: 80 }} />
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  camera: { flex: 1 },
  overlay: { flex: 1, justifyContent: 'space-between', padding: 24 },
  hint: { color: '#fff', textAlign: 'center', fontSize: 13, marginTop: 16, opacity: 0.8 },
  frame: {
    alignSelf: 'center',
    width: 280,
    height: 200,
    borderWidth: 2,
    borderColor: '#16a34a',
    borderRadius: 8,
  },
  controls: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff' },
  cancelButton: { width: 80, padding: 8, alignItems: 'center' },
  cancelText: { color: '#fff', fontSize: 15 },
  button: { backgroundColor: '#16a34a', borderRadius: 8, padding: 14, margin: 24, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600' },
  message: { color: '#fff', textAlign: 'center', margin: 24, fontSize: 15 },
});
