import { Injectable, Inject } from '@nestjs/common';
import { DRIZZLE } from '@src/database/database.module';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '@src/database/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class UserRepository {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async createUser(email: string, partnerCode: string) {
    const user = await this.db
      .insert(schema.users)
      .values({
        email,
        partnerCode,
      })
      .returning();
    return user;
  }

  async findByEmail(email: string) {
    const [user] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email));
    return user;
  }

  async findById(id: string) {
    const [user] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, id))
      .limit(1);
    return user;
  }

  async updatePartner(userId: string, partnerId: string) {
    await this.db
      .update(schema.users)
      .set({ partnerId })
      .where(eq(schema.users.id, userId));
  }

  async findByPartnerCode(partnerCode: string) {
    const [user] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.partnerCode, partnerCode));
    return user;
  }

  async updateLastNotificationAt(userId: string): Promise<void> {
    await this.db
      .update(schema.users)
      .set({ lastRomanticNotificationAt: new Date() })
      .where(eq(schema.users.id, userId));
  }

  async savePushSubscription(
    userId: string,
    subscription: { endpoint: string; p256dh: string; auth: string },
  ): Promise<void> {
    await this.db
      .insert(schema.pushSubscriptions)
      .values({
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      })
      .onConflictDoUpdate({
        target: schema.pushSubscriptions.endpoint,
        set: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      });
  }

  async deletePushSubscription(endpoint: string): Promise<void> {
    await this.db
      .delete(schema.pushSubscriptions)
      .where(eq(schema.pushSubscriptions.endpoint, endpoint));
  }

  async getPartnerPushSubscriptions(
    userId: string,
  ): Promise<schema.PushSubscription[]> {
    const user = await this.findById(userId);
    if (!user || !user.partnerId) return [];

    return this.db
      .select()
      .from(schema.pushSubscriptions)
      .where(eq(schema.pushSubscriptions.userId, user.partnerId));
  }
}
