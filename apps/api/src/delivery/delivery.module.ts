import { Module } from '@nestjs/common';
import { DeliveryController } from './delivery.controller';
import { DeliveryService } from './delivery.service';
import { PickMeAdapter } from './adapters/pickme.adapter';
import { GrasshoppersAdapter } from './adapters/grasshoppers.adapter';

@Module({
  controllers: [DeliveryController],
  providers: [
    DeliveryService,
    PickMeAdapter,
    GrasshoppersAdapter,
    {
      provide: 'DELIVERY_ADAPTERS',
      useFactory: (pickme: PickMeAdapter, grasshoppers: GrasshoppersAdapter) => [
        pickme,
        grasshoppers,
      ],
      inject: [PickMeAdapter, GrasshoppersAdapter],
    },
  ],
  exports: [DeliveryService],
})
export class DeliveryModule {}
