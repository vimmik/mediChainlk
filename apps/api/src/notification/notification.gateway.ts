import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/ws',
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    const userId = client.handshake.auth?.userId;
    if (userId) {
      client.join(`user:${userId}`);
    }
  }

  handleDisconnect(_client: Socket) {
    // Cleanup handled automatically by Socket.IO
  }

  @SubscribeMessage('join:order')
  handleJoinOrder(client: Socket, orderId: string) {
    client.join(`order:${orderId}`);
  }

  @SubscribeMessage('join:pharmacy')
  handleJoinPharmacy(client: Socket, pharmacyId: string) {
    client.join(`pharmacy:${pharmacyId}`);
  }

  emitToUser(userId: string, event: string, data: unknown) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  emitToRoom(room: string, event: string, data: unknown) {
    this.server.to(room).emit(event, data);
  }
}
