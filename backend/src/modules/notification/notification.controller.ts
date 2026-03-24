import { Controller, Post, Body, Delete, Param } from '@nestjs/common';
import { NotificationService } from '@modules/notification/notification.service';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('subscribe')
  async subscribe(
    @Body('userId') userId: string,
    @Body('subscription')
    subscription: { endpoint: string; p256dh: string; auth: string },
  ) {
    await this.notificationService.saveSubscription(userId, subscription);
    return { success: true };
  }

  @Post('unsubscribe')
  async unsubscribe(@Body('endpoint') endpoint: string) {
    await this.notificationService.deleteSubscription(endpoint);
    return { success: true };
  }

  @Post('test')
  async sendTest(@Body('userId') userId: string) {
    return this.notificationService.testNotification(userId);
  }
}
