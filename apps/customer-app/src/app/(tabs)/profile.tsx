import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import auth from '@react-native-firebase/auth';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/authStore';

export default function ProfileScreen() {
  const { user } = useAuthStore();

  const handleSignOut = async () => {
    await auth().signOut();
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.info}>{user?.phone ?? user?.email ?? 'No contact info'}</Text>
      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#f9fafb' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#111827', marginBottom: 8 },
  info: { fontSize: 15, color: '#6b7280', marginBottom: 32 },
  signOutButton: { backgroundColor: '#fee2e2', borderRadius: 8, padding: 14, alignItems: 'center' },
  signOutText: { color: '#dc2626', fontWeight: '600' },
});
