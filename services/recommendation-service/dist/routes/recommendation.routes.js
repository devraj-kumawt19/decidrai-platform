"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const recommendation_controller_1 = require("../controllers/recommendation.controller");
const router = (0, express_1.Router)();
/**
 * POST /recommend
 * Get recommendations based on direct tag input
 * Body: { tags: string[], limit?: number, useAI?: boolean }
 */
router.post('/recommend', recommendation_controller_1.getRecommendations);
/**
 * GET /recommend/session/:sessionId
 * Get recommendations for a completed flow session
 * Query: limit, useAI
 */
router.get('/recommend/session/:sessionId', recommendation_controller_1.getSessionRecommendations);
exports.default = router;
