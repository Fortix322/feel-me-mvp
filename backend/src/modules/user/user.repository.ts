import { Injectable, Inject } from '@nestjs/common';
import { DRIZZLE } from '../../database/database.module';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../database/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class UserRepository {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async createUser(email: string, partnerCode: string): Promise<schema.User> {
    const [user] = await this.db
      .insert(schema.users)
      .values({
        email,
        partnerCode,
      })
      .returning();
    return user;
  }

  async findByEmail(email: string): Promise<schema.User | undefined> {
    const [user] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);
    return user;
  }

  async findByPartnerCode(partnerCode: string): Promise<schema.User | undefined> {
    const [user] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.partnerCode, partnerCode))
      .limit(1);
    return user;
  }
}
