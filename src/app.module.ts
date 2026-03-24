import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppService } from '@src/app.service';
import { UserModule } from '@src/modules/user/user.module';
import { appConfig } from '@src/config/app.config';
import { DatabaseModule } from '@src/database/database.module';
import { NotificationModule } from '@src/modules/notification/notification.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [appConfig],
      isGlobal: true,
    }),
    DatabaseModule,
    UserModule,
    NotificationModule,
  ],
  providers: [AppService],
})
export class AppModule {}
