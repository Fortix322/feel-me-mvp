import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RomanticNotificationService } from '@modules/notification/romantic-notification.service';
import { UserRepository } from '@modules/user/user.repository';
import { Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';

const HOLD_THRESHOLD_MS = 500;
const CONNECTION_LOSS_THRESHOLD_MS = 600;
const ZOMBIE_CONNECTION_THRESHOLD_MS = CONNECTION_LOSS_THRESHOLD_MS * 2;

type UserState = {
  firstPulseAt: number;
  lastPulseAt: number;
  isHolding: boolean;
};

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class InteractionGateway
  implements
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnModuleInit,
    OnModuleDestroy
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(InteractionGateway.name);

  // userId -> socketId
  private activeSessions = new Map<string, string>();
  // userId -> interaction state
  private userStates = new Map<string, UserState>();
  // Background cleanup interval
  private cleanupInterval: NodeJS.Timeout;

  constructor(
    private readonly romanticNotificationService: RomanticNotificationService,
    private readonly userRepository: UserRepository,
  ) {}

  onModuleInit() {
    this.cleanupInterval = setInterval(() => {
      this.garbageCollectInteractions();
    }, 1000);
  }

  onModuleDestroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  async handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      this.activeSessions.set(userId, client.id);
      this.logger.log(`User connected: ${userId}`);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = this.getUserIdBySocketId(client.id);
    if (userId) {
      this.cleanupUser(userId);
      this.logger.log(`User disconnected: ${userId}`);
    }
  }

  @SubscribeMessage('button:pulse')
  async handlePulse(client: Socket) {
    const userId = this.getUserIdBySocketId(client.id);
    if (!userId) return;

    const state = await this.getOrCreateState(userId, client);
    state.lastPulseAt = Date.now();

    this.updateHoldStatus(userId, state);
    await this.syncPartnerInteraction(userId, state, client);
  }

  private async getOrCreateState(
    userId: string,
    client: Socket,
  ): Promise<UserState> {
    let state = this.userStates.get(userId);
    const now = Date.now();

    if (!state) {
      state = { firstPulseAt: now, lastPulseAt: now, isHolding: false };
      this.userStates.set(userId, state);
      this.logger.debug(`Pulse started for ${userId}`);

      // Trigger Romantic Flow on first press
      const sent =
        await this.romanticNotificationService.trySendRomanticNotification(
          userId,
        );
      if (sent) {
        client.emit('romantic:sent', { message: 'She felt your touch! ❤️' });
      }
    }
    return state;
  }

  private updateHoldStatus(userId: string, state: UserState) {
    if (
      !state.isHolding &&
      Date.now() - state.firstPulseAt >= HOLD_THRESHOLD_MS
    ) {
      state.isHolding = true;
      this.logger.log(`User ${userId} reached HOLDING state`);
    }
  }

  private async syncPartnerInteraction(
    userId: string,
    state: UserState,
    client: Socket,
  ) {
    const user = await this.userRepository.findById(userId);
    if (!user?.partnerId) return;

    const partnerState = this.userStates.get(user.partnerId);
    const partnerSocketId = this.activeSessions.get(user.partnerId);

    if (!partnerState || !partnerSocketId) {
      return;
    }

    const partnerIsStillPulsing =
      Date.now() - partnerState.lastPulseAt < CONNECTION_LOSS_THRESHOLD_MS;

    if (!partnerIsStillPulsing) {
      this.cleanupUserInteraction(user.partnerId);
      return;
    }

    // Forward pulse to partner for real-time visual feedback
    this.server.to(partnerSocketId).emit('partner:pulse', {
      isHolding: state.isHolding,
    });

    // Trigger WebRTC if both are officially HOLDING
    if (state.isHolding && partnerState.isHolding) {
      this.initiateWebRTC(userId, user.partnerId, client.id, partnerSocketId);
    }
  }

  private initiateWebRTC(
    callerId: string,
    calleeId: string,
    callerSocketId: string,
    calleeSocketId: string,
  ) {
    this.logger.log(`WebRTC Match! ${callerId} + ${calleeId}`);
    this.server.to(callerSocketId).emit('webrtc:initiate', { isCaller: true });
    this.server.to(calleeSocketId).emit('webrtc:initiate', { isCaller: false });
  }

  @SubscribeMessage('button:release')
  async handleRelease(client: Socket) {
    const userId = this.getUserIdBySocketId(client.id);
    if (!userId) return;

    this.cleanupUserInteraction(userId);
    this.logger.debug(`Button released by ${userId}`);
  }

  @SubscribeMessage('webrtc:signal')
  async handleSignal(client: Socket, data: any) {
    const userId = this.getUserIdBySocketId(client.id);
    if (!userId) return;

    const user = await this.userRepository.findById(userId);
    if (!user?.partnerId) return;

    const partnerSocketId = this.activeSessions.get(user.partnerId);
    if (partnerSocketId) {
      this.server.to(partnerSocketId).emit('webrtc:signal', data);
    }
  }

  private garbageCollectInteractions() {
    const now = Date.now();
    for (const [userId, state] of this.userStates.entries()) {
      if (now - state.lastPulseAt > ZOMBIE_CONNECTION_THRESHOLD_MS) {
        this.logger.debug(
          `Garbage collecting zombie interaction for user: ${userId}`,
        );
        this.cleanupUserInteraction(userId);
      }
    }
  }

  private async cleanupUserInteraction(userId: string) {
    this.userStates.delete(userId);

    const user = await this.userRepository.findById(userId);
    if (user?.partnerId) {
      const partnerSocketId = this.activeSessions.get(user.partnerId);
      if (partnerSocketId) {
        this.server.to(partnerSocketId).emit('partner:release');
      }
    }
  }

  private getUserIdBySocketId(socketId: string): string | undefined {
    return Array.from(this.activeSessions.entries()).find(
      ([_, id]) => id === socketId,
    )?.[0];
  }

  private cleanupUser(userId: string) {
    this.userStates.delete(userId);
    this.activeSessions.delete(userId);
  }
}
