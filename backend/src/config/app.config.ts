import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const ConfigTypeSchema = z.object({
  port: z.string(),
  dbUrl: z.string(),
  vapidPublicKey: z.string(),
  vapidPrivateKey: z.string(),
  vapidEmail: z.email(),
});

export type ConfigType = z.infer<typeof ConfigTypeSchema>;

export const appConfig = registerAs('app', (): ConfigType => {
  const result = ConfigTypeSchema.safeParse({
    port: <string>process.env.PORT,
    dbUrl: <string>process.env.DATABASE_URL,
    vapidPublicKey: <string>process.env.VAPID_PUBLIC_KEY,
    vapidPrivateKey: <string>process.env.VAPID_SECRET_KEY,
    vapidEmail: <string>process.env.VAPID_EMAIL,
  } satisfies ConfigType);

  if (!result.success) {
    throw new Error(`Config validation error: ${result.error.message}`);
  }

  return result.data;
});

export const CONFIG_INJECT_KEY = appConfig.KEY;
