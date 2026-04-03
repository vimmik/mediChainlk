import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useAuthStore } from '@/store/authStore';

export default function HomeScreen() {
  const { user } = useAuthStore();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.greeting}>
          Welcome{user?.phone ? `, ${user.phone}` : ''}
        </Text>
        <Text style={styles.subtitle}>What do you need today?</Text>
      </View>

      <View style={styles.grid}>
        {[
          { label: 'Upload Prescription', screen: 'prescriptions' },
          { label: 'Track Order', screen: 'orders' },
          { label: 'Order History', screen: 'orders' },
          { label: 'My Profile', screen: 'profile' },
        ].map((item) => (
          <View key={item.label} style={styles.card}>
            <Text style={styles.cardText}>{item.label}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  hero: { padding: 24, backgroundColor: '#16a34a' },
  greeting: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 14, color: '#dcfce7', marginTop: 4 },
  grid: { padding: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardText: { fontSize: 14, fontWeight: '500', color: '#111827' },
});
