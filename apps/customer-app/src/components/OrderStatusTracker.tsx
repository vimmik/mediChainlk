import { View, Text, StyleSheet } from 'react-native';
import type { OrderStatus } from '@medichainlk/shared-types';

const ORDER_STEPS: OrderStatus[] = [
  'PAYMENT_AUTHORIZED',
  'PRESCRIPTION_CONFIRMED',
  'PREPARING',
  'DISPATCHED',
  'DELIVERED',
];

interface OrderStatusTrackerProps {
  currentStatus: OrderStatus;
}

export function OrderStatusTracker({ currentStatus }: OrderStatusTrackerProps) {
  const currentIndex = ORDER_STEPS.indexOf(currentStatus);

  return (
    <View style={styles.container}>
      {ORDER_STEPS.map((step, index) => (
        <View key={step} style={styles.step}>
          <View style={[styles.dot, index <= currentIndex && styles.dotActive]} />
          {index < ORDER_STEPS.length - 1 && (
            <View style={[styles.line, index < currentIndex && styles.lineActive]} />
          )}
          <Text style={[styles.label, index <= currentIndex && styles.labelActive]}>
            {step.replace(/_/g, ' ')}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 16 },
  step: { alignItems: 'center', flex: 1 },
  dot: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#d1d5db' },
  dotActive: { backgroundColor: '#16a34a' },
  line: { position: 'absolute', top: 7, left: '50%', right: '-50%', height: 2, backgroundColor: '#d1d5db' },
  lineActive: { backgroundColor: '#16a34a' },
  label: { fontSize: 9, color: '#9ca3af', marginTop: 6, textAlign: 'center' },
  labelActive: { color: '#16a34a', fontWeight: '500' },
});
