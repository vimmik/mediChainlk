import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { PrescriptionCamera } from '@/components/PrescriptionCamera';
import { useState } from 'react';
import { usePrescriptionUpload } from '@/hooks/usePrescriptionUpload';

export default function PrescriptionsScreen() {
  const [showCamera, setShowCamera] = useState(false);
  const upload = usePrescriptionUpload();

  const handleCapture = async (imageUri: string) => {
    setShowCamera(false);
    try {
      await upload.mutateAsync({ imageUri, pharmacyId: 'default' });
      Alert.alert('Success', 'Prescription submitted. A pharmacist will review it shortly.');
    } catch {
      Alert.alert('Error', 'Failed to upload prescription. Please try again.');
    }
  };

  if (showCamera) {
    return <PrescriptionCamera onCapture={handleCapture} onCancel={() => setShowCamera(false)} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Prescriptions</Text>
      <TouchableOpacity style={styles.button} onPress={() => setShowCamera(true)}>
        <Text style={styles.buttonText}>Upload New Prescription</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#f9fafb' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#111827', marginBottom: 24 },
  button: { backgroundColor: '#16a34a', borderRadius: 8, padding: 16, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
