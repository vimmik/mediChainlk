export type DeliveryProvider = 'PICKME_FLASH' | 'GRASSHOPPERS' | 'OWN_FLEET' | 'MANUAL';

export type DeliveryStatus =
  | 'PENDING'
  | 'ASSIGNED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'FAILED';

export interface DeliveryQuote {
  provider: DeliveryProvider;
  estimatedFee: number;
  currency: 'LKR';
  estimatedMinutes: number;
  available: boolean;
}
