import { redis } from '@/lib/upstash';

export async function pushRecentTopic(userId: string, topic: string) {
  if (!topic) return;
  const key = `user:${userId}:topics`;
  
  // Push to left of list
  await redis.lpush(key, topic);
  
  // Keep only the last 20 topics
  await redis.ltrim(key, 0, 19);
  
  // Set expiry to 7 days
  await redis.expire(key, 60 * 60 * 24 * 7);
}

export async function getRecentTopics(userId: string): Promise<string[]> {
  const key = `user:${userId}:topics`;
  const topics = await redis.lrange(key, 0, 9); // Return last 10
  return topics.filter(Boolean) as string[];
}
