import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import auth from '@react-native-firebase/auth';
import { router } from 'expo-router';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmation, setConfirmation] = useState<ReturnType<typeof auth>['signInWithPhoneNumber'] extends (...args: any[]) => Promise<infer R> ? R : never | null>(null);
  const [loading, setLoading] = useState(false);

  const sendOtp = async () => {
    if (!phone.startsWith('+')) {
      Alert.alert('Enter phone number with country code, e.g. +94771234567');
      return;
    }
    setLoading(true);
    try {
      const result = await auth().signInWithPhoneNumber(phone);
      setConfirmation(result as any);
    } catch (e) {
      Alert.alert('Failed to send OTP. Check the number and try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!confirmation) return;
    setLoading(true);
    try {
      await (confirmation as any).confirm(otp);
      router.replace('/(tabs)/home');
    } catch {
      Alert.alert('Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>MediChainLK</Text>
      <Text style={styles.subtitle}>Enter your phone number to continue</Text>

      <TextInput
        style={styles.input}
        placeholder="+94771234567"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
        editable={!confirmation}
      />

      {confirmation && (
        <TextInput
          style={styles.input}
          placeholder="Enter OTP"
          keyboardType="number-pad"
          value={otp}
          onChangeText={setOtp}
        />
      )}

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={confirmation ? verifyOtp : sendOtp}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Please wait...' : confirmation ? 'Verify OTP' : 'Send OTP'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', color: '#16a34a', marginBottom: 8 },
  subtitle: { fontSize: 14, textAlign: 'center', color: '#6b7280', marginBottom: 32 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 14, marginBottom: 16, fontSize: 16 },
  button: { backgroundColor: '#16a34a', borderRadius: 8, padding: 16, alignItems: 'center' },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
