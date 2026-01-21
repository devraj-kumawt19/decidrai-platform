"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CACHE_TTL = void 0;
exports.getRecommendationCacheKey = getRecommendationCacheKey;
exports.getSessionRecCacheKey = getSessionRecCacheKey;
exports.createTagsHash = createTagsHash;
exports.getCache = getCache;
exports.setCache = setCache;
exports.delCache = delCache;
exports.delCachePattern = delCachePattern;
const db_1 = require("db");
// Lazy Redis client getter to avoid initialization before dotenv.config()
let redis = null;
function getRedis() {
    if (!redis) {
        redis = (0, db_1.getRedisClient)();
    }
    return redis;
}
exports.CACHE_TTL = {
    RECOMMENDATIONS: 3600, // 1 hour
    TOOLS_LIST: 300, // 5 minutes (tools don't change often)
    SESSION_DATA: 1800 // 30 minutes
};
/**
 * Generate cache key for recommendations
 */
function getRecommendationCacheKey(tagsHash) {
    return `recs:${tagsHash}`;
}
/**
 * Generate cache key for session recommendations
 */
function getSessionRecCacheKey(sessionId) {
    return `recs:session:${sessionId}`;
}
/**
 * Create a hash from tags array for caching
 */
function createTagsHash(tags) {
    const sortedTags = [...tags].sort();
    return sortedTags.join(':').toLowerCase().replace(/\s+/g, '-');
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
async function setCache(key, value, ttlSeconds = exports.CACHE_TTL.RECOMMENDATIONS) {
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
