"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const comparison_controller_1 = require("../controllers/comparison.controller");
const router = (0, express_1.Router)();
/**
 * GET /compare?tools=slug1,slug2
 * Get or generate comparison by tool slugs
 */
router.get('/compare', comparison_controller_1.getComparison);
/**
 * POST /compare
 * Generate new comparison
 * Body: { tools: ["slug1", "slug2"] }
 */
router.post('/compare', comparison_controller_1.createComparison);
/**
 * GET /compare/popular
 * Get popular comparisons
 */
router.get('/compare/popular', comparison_controller_1.getPopular);
exports.default = router;
