import { Injectable } from '@nestjs/common';
import type { DeliveryQuote } from '@medichainlk/shared-types';
import {
  IDeliveryAdapter,
  DeliveryAddress,
  DispatchResult,
  DeliveryStatusResult,
} from './delivery-adapter.interface';

@Injectable()
export class PickMeAdapter implements IDeliveryAdapter {
  readonly provider = 'PICKME_FLASH' as const;

  async getQuote(pickup: DeliveryAddress, dropoff: DeliveryAddress): Promise<DeliveryQuote> {
    // TODO: Call PickMe Flash API with corporate merchant credentials
    // Requires business relationship via engineering@pickme.lk
    return {
      provider: 'PICKME_FLASH',
      estimatedFee: 350, // placeholder LKR
      currency: 'LKR',
      estimatedMinutes: 30,
      available: true,
    };
  }

  async dispatch(
    orderId: string,
    pickup: DeliveryAddress,
    dropoff: DeliveryAddress,
  ): Promise<DispatchResult> {
    // TODO: Call PickMe auto-dispatch API
    return {
      trackingId: `PM-${orderId}`,
      provider: 'PICKME_FLASH',
      estimatedPickupTime: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    };
  }

  async getStatus(trackingId: string): Promise<DeliveryStatusResult | null> {
    // TODO: Call PickMe tracking API
    return {
      trackingId,
      provider: 'PICKME_FLASH',
      status: 'PENDING',
      updatedAt: new Date().toISOString(),
    };
  }
}
