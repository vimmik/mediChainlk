import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { DeliveryQuote } from '@medichainlk/shared-types';

interface DeliveryQuoteCardProps {
  quote: DeliveryQuote;
  selected: boolean;
  onSelect: () => void;
}

const providerLabels: Record<DeliveryQuote['provider'], string> = {
  PICKME_FLASH: 'PickMe Flash',
  GRASSHOPPERS: 'Grasshoppers',
  OWN_FLEET: 'Direct Delivery',
  MANUAL: 'Manual Dispatch',
};

export function DeliveryQuoteCard({ quote, selected, onSelect }: DeliveryQuoteCardProps) {
  return (
    <TouchableOpacity
      style={[styles.card, selected && styles.cardSelected]}
      onPress={onSelect}
    >
      <View style={styles.row}>
        <Text style={styles.provider}>{providerLabels[quote.provider]}</Text>
        <Text style={styles.fee}>LKR {quote.estimatedFee.toFixed(2)}</Text>
      </View>
      <Text style={styles.eta}>Est. {quote.estimatedMinutes} min</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginVertical: 6,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
  },
  cardSelected: { borderColor: '#16a34a', backgroundColor: '#f0fdf4' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  provider: { fontSize: 15, fontWeight: '600', color: '#111827' },
  fee: { fontSize: 16, fontWeight: 'bold', color: '#16a34a' },
  eta: { fontSize: 12, color: '#6b7280', marginTop: 4 },
});
