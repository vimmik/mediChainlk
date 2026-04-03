import { Inject, Injectable } from '@nestjs/common';
import { IDeliveryAdapter } from './adapters/delivery-adapter.interface';
import { GetQuotesDto } from './dto/get-quotes.dto';
import { DispatchDeliveryDto } from './dto/dispatch-delivery.dto';
import type { DeliveryQuote } from '@medichainlk/shared-types';

@Injectable()
export class DeliveryService {
  constructor(
    @Inject('DELIVERY_ADAPTERS')
    private adapters: IDeliveryAdapter[],
  ) {}

  async getQuotes(dto: GetQuotesDto): Promise<DeliveryQuote[]> {
    // Scatter-gather: request quotes from all providers in parallel with 3s timeout
    const quotePromises = this.adapters.map((adapter) =>
      Promise.race([
        adapter.getQuote(dto.pickupAddress, dto.dropoffAddress),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
      ]),
    );

    const results = await Promise.all(quotePromises);
    return results
      .filter((q): q is DeliveryQuote => q !== null && q.available)
      .sort((a, b) => a.estimatedFee - b.estimatedFee);
  }

  async dispatch(dto: DispatchDeliveryDto) {
    const adapter = this.adapters.find((a) => a.provider === dto.provider);
    if (!adapter) {
      throw new Error(`Delivery provider ${dto.provider} not available`);
    }
    return adapter.dispatch(dto.orderId, dto.pickupAddress, dto.dropoffAddress);
  }

  async getStatus(trackingId: string) {
    // Try each adapter until we find the tracking ID
    for (const adapter of this.adapters) {
      try {
        const status = await adapter.getStatus(trackingId);
        if (status) return status;
      } catch {
        continue;
      }
    }
    return null;
  }
}
