"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSessionRecommendations = exports.getRecommendations = void 0;
const recommendation_service_1 = require("../services/recommendation.service");
/**
 * Get recommendations based on direct tag input
 * POST /recommend
 * Body: { tags: string[], limit?: number, useAI?: boolean }
 */
const getRecommendations = async (req, res) => {
    try {
        const { tags, limit = 3, useAI = true } = req.body;
        if (!tags || !Array.isArray(tags) || tags.length === 0) {
            res.status(400).json({
                success: false,
                message: 'Tags array is required'
            });
            return;
        }
        const recommendations = await (0, recommendation_service_1.getRecommendationsByTags)(tags, { limit, useAI });
        res.json({
            success: true,
            data: recommendations
        });
    }
    catch (error) {
        console.error('[RecommendationController] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate recommendations',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getRecommendations = getRecommendations;
/**
 * Get recommendations for a flow session
 * GET /recommend/session/:sessionId
 */
const getSessionRecommendations = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { limit = 3, useAI = true } = req.query;
        if (!sessionId) {
            res.status(400).json({
                success: false,
                message: 'Session ID is required'
            });
            return;
        }
        const recommendations = await (0, recommendation_service_1.getRecommendationsForSession)(sessionId, {
            limit: Number(limit),
            useAI: useAI !== 'false'
        });
        if (!recommendations) {
            res.status(404).json({
                success: false,
                message: 'Session not found or has no extracted tags. Complete the flow first.'
            });
            return;
        }
        res.json({
            success: true,
            data: recommendations
        });
    }
    catch (error) {
        console.error('[RecommendationController] Session error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate recommendations for session',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getSessionRecommendations = getSessionRecommendations;
