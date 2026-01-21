"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrCreateComparison = getOrCreateComparison;
exports.getPopularComparisons = getPopularComparisons;
const mongoose_1 = __importDefault(require("mongoose"));
const Comparison_1 = require("../models/Comparison");
const comparisonGenerator_1 = require("../generators/comparisonGenerator");
const cache_service_1 = require("./cache.service");
/**
 * Get or generate comparison by tool slugs
 */
async function getOrCreateComparison(slugs, options = {}) {
    const { forceRegenerate = false } = options;
    // Sort slugs for consistent lookup
    const sortedSlugs = [...slugs].sort();
    const cacheKey = (0, cache_service_1.getComparisonCacheKey)(sortedSlugs);
    // Check Redis cache first (unless force regenerate)
    if (!forceRegenerate) {
        const cached = await (0, cache_service_1.getCache)(cacheKey);
        if (cached) {
            console.log('[ComparisonService] Cache hit for:', sortedSlugs);
            return { ...cached, cached: true };
        }
        // Check MongoDB for existing comparison
        const existing = await Comparison_1.Comparison.findOne({
            toolSlugs: { $all: sortedSlugs, $size: sortedSlugs.length }
        });
        if (existing && existing.cacheUntil > new Date()) {
            // Increment view count
            existing.viewCount += 1;
            await existing.save();
            const response = formatComparisonResponse(existing, [], true);
            await (0, cache_service_1.setCache)(cacheKey, response, cache_service_1.CACHE_TTL.COMPARISON);
            return response;
        }
    }
    // Fetch tools from tool-service
    const tools = await (0, comparisonGenerator_1.fetchToolsBySlugs)(sortedSlugs);
    if (tools.length < 2) {
        console.error('[ComparisonService] Not enough tools found:', tools.length);
        return null;
    }
    // Generate comparison using AI
    console.log('[ComparisonService] Generating comparison for:', sortedSlugs);
    const generated = await (0, comparisonGenerator_1.generateComparison)(tools);
    // Save to MongoDB
    const comparison = new Comparison_1.Comparison({
        toolIds: tools.map(t => new mongoose_1.default.Types.ObjectId(t._id)),
        toolSlugs: sortedSlugs,
        summary: generated.summary,
        winnerScenarios: generated.winnerScenarios.map(ws => ({
            toolId: new mongoose_1.default.Types.ObjectId(tools.find(t => t.slug === ws.toolSlug)?._id),
            toolSlug: ws.toolSlug,
            scenario: ws.scenario,
            reasoning: ws.reasoning
        })),
        featureComparison: generated.featureComparison.map(fc => ({
            feature: fc.feature,
            description: fc.description,
            toolValues: new Map(Object.entries(fc.toolValues))
        })),
        generatedAt: new Date(),
        cacheUntil: new Date(Date.now() + cache_service_1.CACHE_TTL.COMPARISON * 1000),
        viewCount: 1
    });
    await comparison.save();
    // Format response
    const response = formatComparisonResponse(comparison, tools, false);
    // Cache in Redis
    await (0, cache_service_1.setCache)(cacheKey, response, cache_service_1.CACHE_TTL.COMPARISON);
    return response;
}
/**
 * Format comparison document to response
 */
function formatComparisonResponse(comparison, tools, cached) {
    return {
        id: comparison._id.toString(),
        tools: comparison.toolSlugs.map(slug => {
            const tool = tools.find(t => t.slug === slug);
            return {
                slug,
                name: tool?.name || slug,
                tagline: tool?.tagline,
                pricing: tool?.pricing.model || 'Unknown'
            };
        }),
        summary: comparison.summary,
        winnerScenarios: comparison.winnerScenarios.map(ws => ({
            toolSlug: ws.toolSlug,
            scenario: ws.scenario,
            reasoning: ws.reasoning
        })),
        featureComparison: comparison.featureComparison.map(fc => ({
            feature: fc.feature,
            description: fc.description,
            toolValues: Object.fromEntries(fc.toolValues)
        })),
        generatedAt: comparison.generatedAt,
        viewCount: comparison.viewCount,
        cached
    };
}
/**
 * Get popular comparisons
 */
async function getPopularComparisons(limit = 5) {
    const comparisons = await Comparison_1.Comparison.find()
        .sort({ viewCount: -1 })
        .limit(limit)
        .lean();
    return comparisons.map(c => formatComparisonResponse(c, [], true));
}
