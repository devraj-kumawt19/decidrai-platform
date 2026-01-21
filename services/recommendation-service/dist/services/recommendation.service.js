"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecommendationsByTags = getRecommendationsByTags;
exports.getRecommendationsForSession = getRecommendationsForSession;
const tagMatcher_1 = require("../matchers/tagMatcher");
const ranking_1 = require("../ranking/ranking");
const explainer_1 = require("../explainers/explainer");
const cache_service_1 = require("./cache.service");
/**
 * Get recommendations based on user tags
 */
async function getRecommendationsByTags(userTags, options = {}) {
    const { limit = 3, useAI = true, skipCache = false } = options;
    // Check cache first
    const tagsHash = (0, cache_service_1.createTagsHash)(userTags);
    const cacheKey = (0, cache_service_1.getRecommendationCacheKey)(tagsHash);
    if (!skipCache) {
        const cached = await (0, cache_service_1.getCache)(cacheKey);
        if (cached) {
            console.log('[RecommendationService] Cache hit for tags:', tagsHash);
            return { ...cached, cached: true };
        }
    }
    // Fetch tools from tool-service
    const tools = await (0, tagMatcher_1.fetchTools)();
    if (tools.length === 0) {
        return {
            recommendations: [],
            totalMatched: 0,
            extractedTags: userTags,
            cached: false
        };
    }
    // Match and score tools
    const scoredTools = (0, tagMatcher_1.matchToolsToTags)(tools, userTags);
    const totalMatched = scoredTools.length;
    // Rank and get top N
    const topTools = (0, ranking_1.rankTools)(scoredTools, { topN: limit });
    // Generate explanations
    const explanations = await (0, explainer_1.generateExplanations)(topTools, userTags, useAI);
    // Build response
    const recommendations = topTools.map((item, index) => ({
        tool: {
            id: item.tool._id,
            name: item.tool.name,
            slug: item.tool.slug,
            tagline: item.tool.tagline,
            pricing: item.tool.pricing
        },
        score: Math.round(item.score),
        rank: index + 1,
        reasoning: explanations.get(item.tool._id) || {
            whyRecommended: 'This tool matches your requirements.',
            bestFor: 'Works well for your use case.',
            whenNotToUse: 'Generally applicable.'
        },
        affiliate_link: item.tool.affiliate_link,
        is_sponsored: item.tool.is_sponsored
    }));
    const response = {
        recommendations,
        totalMatched,
        extractedTags: userTags,
        cached: false
    };
    // Cache the response
    await (0, cache_service_1.setCache)(cacheKey, response, cache_service_1.CACHE_TTL.RECOMMENDATIONS);
    return response;
}
/**
 * Get recommendations for a flow session
 */
async function getRecommendationsForSession(sessionId, options = {}) {
    const { limit = 3, useAI = true, skipCache = false } = options;
    // Check session-specific cache
    const sessionCacheKey = (0, cache_service_1.getSessionRecCacheKey)(sessionId);
    if (!skipCache) {
        const cached = await (0, cache_service_1.getCache)(sessionCacheKey);
        if (cached) {
            console.log('[RecommendationService] Cache hit for session:', sessionId);
            return { ...cached, cached: true };
        }
    }
    // Fetch session data from flow-service
    const session = await (0, tagMatcher_1.fetchFlowSession)(sessionId);
    if (!session || session.extractedTags.length === 0) {
        console.log('[RecommendationService] No tags found for session:', sessionId);
        return null;
    }
    // Get recommendations using extracted tags
    const response = await getRecommendationsByTags(session.extractedTags, {
        limit,
        useAI,
        skipCache: true // We'll cache at session level
    });
    // Cache at session level (shorter TTL since session might be updated)
    await (0, cache_service_1.setCache)(sessionCacheKey, response, cache_service_1.CACHE_TTL.SESSION_DATA);
    return response;
}
