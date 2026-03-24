import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { RomanticNotificationService } from './romantic-notification.service';
import { NotificationController } from './notification.controller';
import { UserModule } from '@modules/user/user.module';

@Module({
  imports: [UserModule],
  controllers: [NotificationController],
  providers: [NotificationService, RomanticNotificationService],
  exports: [NotificationService, RomanticNotificationService],
})
export class NotificationModule {}

