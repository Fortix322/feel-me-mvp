import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const AppConfigSchema = z.object({
  port: z.string(),
  dbUrl: z.string(),
});

export type ConfigType = z.infer<typeof AppConfigSchema>;

export const appConfig = registerAs('app', (): ConfigType => {
  const result = AppConfigSchema.safeParse({
    port: <string>process.env.PORT,
    dbUrl: <string>process.env.DATABASE_URL,
  } satisfies ConfigType);

  if (!result.success) {
    throw new Error(`Config validation error: ${result.error.message}`);
  }

  return result.data;
});

export const CONFIG_INJECT_KEY = appConfig.KEY;
