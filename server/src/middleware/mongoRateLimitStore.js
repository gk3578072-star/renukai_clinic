import { createHmac } from 'node:crypto';
import RateLimitCounter from '../models/RateLimitCounter.js';

export default class MongoRateLimitStore {
  constructor(namespace = 'default') {
    this.namespace = namespace;
    this.windowMs = 15 * 60 * 1000;
  }

  init(options) {
    this.windowMs = options.windowMs;
  }

  async increment(key) {
    const now = Date.now();
    const bucket = Math.floor(now / this.windowMs);
    const resetAt = new Date((bucket + 1) * this.windowMs);
    const counterKey = this.counterKey(key, bucket);
    let counter;

    try {
      counter = await RateLimitCounter.findOneAndUpdate(
        { key: counterKey },
        { $inc: { count: 1 }, $setOnInsert: { expiresAt: resetAt } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      ).lean();
    } catch (error) {
      if (error?.code !== 11000) throw error;
      counter = await RateLimitCounter.findOneAndUpdate(
        { key: counterKey },
        { $inc: { count: 1 } },
        { new: true },
      ).lean();
    }
    return { totalHits: counter.count, resetTime: resetAt };
  }

  async decrement(key) {
    const counterKey = this.getCounterKey(key);
    await RateLimitCounter.updateOne(
      { key: counterKey, count: { $gt: 0 } },
      { $inc: { count: -1 } },
    );
  }

  async resetKey(key) {
    await RateLimitCounter.deleteOne({ key: this.getCounterKey(key) });
  }

  getCounterKey(key) {
    return this.counterKey(key, Math.floor(Date.now() / this.windowMs));
  }

  counterKey(key, bucket) {
    const digest = createHmac('sha256', process.env.JWT_SECRET)
      .update(`${this.namespace}:${String(key)}`)
      .digest('hex');
    return `${digest}:${bucket}`;
  }
}
