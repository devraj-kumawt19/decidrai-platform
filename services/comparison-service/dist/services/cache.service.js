"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CACHE_TTL = void 0;
exports.getComparisonCacheKey = getComparisonCacheKey;
exports.getCache = getCache;
exports.setCache = setCache;
exports.delCache = delCache;
exports.delCachePattern = delCachePattern;
const db_1 = require("db");
// Lazy Redis client getter
let redis = null;
function getRedis() {
    if (!redis) {
        redis = (0, db_1.getRedisClient)();
    }
    return redis;
}
exports.CACHE_TTL = {
    COMPARISON: 86400 * 7, // 7 days
    TOOLS_DATA: 300 // 5 minutes
};
/**
 * Generate cache key for comparison
 */
function getComparisonCacheKey(slugs) {
    const sortedSlugs = [...slugs].sort();
    return `comparison:${sortedSlugs.join(':')}`;
}
/**
 * Get cached data
 */
async function getCache(key) {
    try {
        const data = await getRedis().get(key);
        if (!data)
            return null;
        return JSON.parse(data);
    }
    catch (error) {
        console.error('[Cache] Get error:', error);
        return null;
    }
}
/**
 * Set cached data with TTL
 */
async function setCache(key, value, ttlSeconds = exports.CACHE_TTL.COMPARISON) {
    try {
        await getRedis().set(key, JSON.stringify(value), 'EX', ttlSeconds);
    }
    catch (error) {
        console.error('[Cache] Set error:', error);
    }
}
/**
 * Delete cached data
 */
async function delCache(key) {
    try {
        await getRedis().del(key);
    }
    catch (error) {
        console.error('[Cache] Delete error:', error);
    }
}
/**
 * Delete cache by pattern
 */
async function delCachePattern(pattern) {
    try {
        const keys = await getRedis().keys(pattern);
        if (keys.length > 0) {
            await getRedis().del(...keys);
        }
    }
    catch (error) {
        console.error('[Cache] Pattern delete error:', error);
    }
}
