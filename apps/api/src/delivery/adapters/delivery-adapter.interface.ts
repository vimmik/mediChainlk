import type { DeliveryProvider, DeliveryQuote, DeliveryStatus } from '@medichainlk/shared-types';

export interface DeliveryAddress {
  line1: string;
  city: string;
  latitude?: number;
  longitude?: number;
}

export interface DispatchResult {
  trackingId: string;
  provider: DeliveryProvider;
  estimatedPickupTime: string;
}

export interface DeliveryStatusResult {
  trackingId: string;
  provider: DeliveryProvider;
  status: DeliveryStatus;
  driverName?: string;
  driverPhone?: string;
  currentLocation?: { lat: number; lng: number };
  updatedAt: string;
}

export interface IDeliveryAdapter {
  provider: DeliveryProvider;
  getQuote(pickup: DeliveryAddress, dropoff: DeliveryAddress): Promise<DeliveryQuote>;
  dispatch(orderId: string, pickup: DeliveryAddress, dropoff: DeliveryAddress): Promise<DispatchResult>;
  getStatus(trackingId: string): Promise<DeliveryStatusResult | null>;
}
