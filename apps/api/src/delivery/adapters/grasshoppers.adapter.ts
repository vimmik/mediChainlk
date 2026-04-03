import { Injectable } from '@nestjs/common';
import type { DeliveryQuote } from '@medichainlk/shared-types';
import {
  IDeliveryAdapter,
  DeliveryAddress,
  DispatchResult,
  DeliveryStatusResult,
} from './delivery-adapter.interface';

@Injectable()
export class GrasshoppersAdapter implements IDeliveryAdapter {
  readonly provider = 'GRASSHOPPERS' as const;

  async getQuote(pickup: DeliveryAddress, dropoff: DeliveryAddress): Promise<DeliveryQuote> {
    // TODO: Call Grasshoppers API with Corporate ID
    return {
      provider: 'GRASSHOPPERS',
      estimatedFee: 500, // placeholder LKR
      currency: 'LKR',
      estimatedMinutes: 120,
      available: true,
    };
  }

  async dispatch(
    orderId: string,
    pickup: DeliveryAddress,
    dropoff: DeliveryAddress,
  ): Promise<DispatchResult> {
    // TODO: Call Grasshoppers dispatch API
    return {
      trackingId: `GH-${orderId}`,
      provider: 'GRASSHOPPERS',
      estimatedPickupTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    };
  }

  async getStatus(trackingId: string): Promise<DeliveryStatusResult | null> {
    // TODO: Call Grasshoppers tracking API
    return {
      trackingId,
      provider: 'GRASSHOPPERS',
      status: 'PENDING',
      updatedAt: new Date().toISOString(),
    };
  }
}
