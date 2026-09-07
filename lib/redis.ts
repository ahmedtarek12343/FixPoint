import { Redis } from "@upstash/redis";
const redis = new Redis({
  url: "https://profound-glider-189808.upstash.io",
  token: "gQAAAAAAAuVwAAIgcDE3ZTFjNGY4YTBmOTM0NmE5OGJiMjA5YjU0MzkyYTZlZg",
});

await redis.set("foo", "bar");
await redis.get("foo");
