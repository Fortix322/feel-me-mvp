import { Injectable, Logger } from '@nestjs/common';
import { NotificationService } from '@modules/notification/notification.service';
import { UserRepository } from '@modules/user/user.repository';

const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

@Injectable()
export class RomanticNotificationService {
  private readonly logger = new Logger(RomanticNotificationService.name);

  // You can easily add more here later!
  private readonly romanticMessages = [
    { title: '❤️ Connection', body: 'You are feeling their touch' },
    { title: '🌹 Romantic Gesture', body: 'Your partner is thinking of you.' },
    { title: '✨ Spark', body: 'Can you feel my heart beating for you?' },
    { title: '🌙 Thinking of you', body: 'Just a sweet thought for you.' },
  ];

  constructor(
    private readonly notificationService: NotificationService,
    private readonly userRepository: UserRepository,
  ) {}

  /**
   * Tries to send a romantic notification to the partner.
   * Returns true if a Push Notification was sent, false if it's on cooldown.
   */
  async trySendRomanticNotification(userId: string): Promise<boolean> {
    const user = await this.userRepository.findById(userId);
    if (!user) return false;

    const now = new Date();
    const lastSent = user.lastRomanticNotificationAt;

    if (lastSent && now.getTime() - lastSent.getTime() < COOLDOWN_MS) {
      this.logger.debug(`Romantic notification on cooldown for ${userId}`);
      return false;
    }

    // Pick a message
    const randomIndex = Math.floor(
      Math.random() * this.romanticMessages.length,
    );
    const message = this.romanticMessages[randomIndex];

    // Send it
    await this.notificationService.sendToPartner(userId, message);
    await this.userRepository.updateLastNotificationAt(userId);

    this.logger.log(`Romantic notification sent from ${userId}`);
    return true;
  }
}
