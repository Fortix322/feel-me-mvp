import { Module, Global } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '@src/database/schema';
import { CONFIG_INJECT_KEY, ConfigType } from '@src/config/app.config';

export const DRIZZLE = 'DRIZZLE';

@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE,
      inject: [CONFIG_INJECT_KEY],
      useFactory: async (config: ConfigType) => {
        const pool = new Pool({
          connectionString: config.dbUrl,
        });
        return drizzle(pool, { schema });
      },
    },
  ],
  exports: [DRIZZLE],
})
export class DatabaseModule {}
