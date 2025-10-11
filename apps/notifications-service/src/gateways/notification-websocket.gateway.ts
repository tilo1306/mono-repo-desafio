import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WebSocketService } from '../services/websocket.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class NotificationWebSocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationWebSocketGateway.name);

  constructor(private readonly webSocketService: WebSocketService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

  }

  @SubscribeMessage('authenticate')
  handleAuthenticate(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { userId } = data;

    this.webSocketService.addClient(userId, client);

    this.logger.log(`User ${userId} authenticated with socket ${client.id}`);

    client.emit('authenticated', { success: true });
  }

  @SubscribeMessage('disconnect')
  handleDisconnectMessage(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { userId } = data;

    this.webSocketService.removeClient(userId);

    this.logger.log(`User ${userId} requested disconnect`);
  }
}
