import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { NotificationGateway } from './notification.gateway';

@Injectable()
export class NotificationService {
  constructor(private readonly gateway: NotificationGateway) {}

  async sendPushNotification(fcmToken: string, title: string, body: string, data?: Record<string, string>) {
    await admin.messaging().send({
      token: fcmToken,
      notification: { title, body },
      data,
    });
  }

  emitOrderStatusUpdate(userId: string, orderId: string, status: string) {
    this.gateway.emitToUser(userId, 'order:status', { orderId, status });
  }

  emitDeliveryLocationUpdate(orderId: string, location: { lat: number; lng: number }) {
    this.gateway.emitToRoom(`order:${orderId}`, 'delivery:location', location);
  }

  emitInventoryAlert(tenantId: string, pharmacyId: string, medicineId: string, quantity: number) {
    this.gateway.emitToRoom(`pharmacy:${pharmacyId}`, 'inventory:low-stock', {
      medicineId,
      quantity,
    });
  }
}
