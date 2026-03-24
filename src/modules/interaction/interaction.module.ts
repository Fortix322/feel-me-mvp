import { Module } from '@nestjs/common';
import { InteractionGateway } from '@modules/interaction/interaction.gateway';
import { NotificationModule } from '@modules/notification/notification.module';
import { UserModule } from '@modules/user/user.module';

@Module({
  imports: [NotificationModule, UserModule],
  providers: [InteractionGateway],
})
export class InteractionModule {}
