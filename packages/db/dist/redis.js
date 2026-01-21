"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRedisClient = getRedisClient;
const ioredis_1 = __importDefault(require("ioredis"));
/**
 * We create ONE Redis client.
 * Services reuse it.
 * Simple, predictable, production-safe.
 */
let redis = null;
function getRedisClient() {
    if (!redis) {
        if (!process.env.REDIS_URL) {
            throw new Error("Redis env variable REDIS_URL missing");
        }
        const options = {};
        if (process.env.REDIS_TOKEN) {
            options.password = process.env.REDIS_TOKEN;
        }
        console.log(`[Redis] Connecting to ${process.env.REDIS_URL?.replace(/:[^:@]*@/, ':****@')}`);
        redis = new ioredis_1.default(process.env.REDIS_URL, options);
        redis.on('error', (err) => {
            console.error('Redis connection error:', err);
        });
    }
    return redis;
}
