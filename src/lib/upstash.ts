import { Redis } from '@upstash/redis';

const url = process.env.UPSTASH_REDIS_REST_URL || '';
const token = process.env.UPSTASH_REDIS_REST_TOKEN || '';

// Create a dummy client if URL is invalid (e.g. placeholder) so the build doesn't crash
export const redis = url.startsWith('http') ? new Redis({ url, token }) : {
  lpush: async () => {},
  ltrim: async () => {},
  expire: async () => {},
  lrange: async () => [],
} as any;
