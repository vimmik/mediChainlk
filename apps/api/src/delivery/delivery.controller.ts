import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DeliveryService } from './delivery.service';
import { GetQuotesDto } from './dto/get-quotes.dto';
import { DispatchDeliveryDto } from './dto/dispatch-delivery.dto';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';

@ApiTags('Delivery')
@ApiBearerAuth()
@UseGuards(FirebaseAuthGuard)
@Controller('delivery')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Post('quotes')
  getQuotes(@Body() dto: GetQuotesDto) {
    return this.deliveryService.getQuotes(dto);
  }

  @Post('dispatch')
  dispatch(@Body() dto: DispatchDeliveryDto) {
    return this.deliveryService.dispatch(dto);
  }

  @Get(':trackingId/status')
  getStatus(@Param('trackingId') trackingId: string) {
    return this.deliveryService.getStatus(trackingId);
  }
}
