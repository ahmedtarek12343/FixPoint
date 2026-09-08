import { Redis } from "@upstash/redis";
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL as string,
  token: process.env.UPSTASH_REDIS_TOKEN as string,
});

await redis.set("foo", "bar");
await redis.get("foo");
