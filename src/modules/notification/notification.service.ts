import { Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common';
import * as webpush from 'web-push';
import { CONFIG_INJECT_KEY, type ConfigType } from '@src/config/app.config';
import { UserRepository } from '@modules/user/user.repository';

@Injectable()
export class NotificationService implements OnModuleInit {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @Inject(CONFIG_INJECT_KEY)
    private readonly config: ConfigType,
    private readonly userRepository: UserRepository,
  ) {}

  onModuleInit() {
    webpush.setVapidDetails(
      `mailto:${this.config.vapidEmail}`,
      this.config.vapidPublicKey,
      this.config.vapidPrivateKey,
    );
  }

  async saveSubscription(
    userId: string,
    subscription: { endpoint: string; p256dh: string; auth: string },
  ) {
    return this.userRepository.savePushSubscription(userId, subscription);
  }

  async deleteSubscription(endpoint: string) {
    return this.userRepository.deletePushSubscription(endpoint);
  }

  async sendToPartner(
    userId: string,
    payload: { title: string; body: string },
  ) {
    const subscriptions =
      await this.userRepository.getPartnerPushSubscriptions(userId);

    const promises = subscriptions.map((sub) =>
      webpush
        .sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          JSON.stringify(payload),
        )
        .catch(async (err) => {
          if (err.statusCode === 410 || err.statusCode === 404) {
            // Subscription expired or revoked - Clean it up
            await this.deleteSubscription(sub.endpoint);
            this.logger.warn(
              `Push subscription expired/invalid, deleted: ${sub.endpoint}`,
            );
          } else {
            this.logger.error(
              `Push notification error: ${err.message}`,
              err.stack,
            );
          }
        }),
    );

    await Promise.all(promises);
  }

  async testNotification(userId: string) {
    await this.sendToPartner(userId, {
      title: 'Test Notification 🔔',
      body: 'If you see this, push notifications are working!',
    });
    return { success: true };
  }
}
