"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const flow_controller_1 = require("../controllers/flow.controller");
const router = (0, express_1.Router)();
// ==================== PUBLIC ROUTES ====================
/**
 * GET /flows
 * Get all flows with pagination and filters
 */
router.get('/flows', flow_controller_1.getAllFlows);
/**
 * GET /flows/:slug
 * Get flow by slug
 */
router.get('/flows/:slug', flow_controller_1.getFlowBySlug);
/**
 * POST /flows/:slug/start
 * Start a new flow session
 */
router.post('/flows/:slug/start', flow_controller_1.startFlow);
/**
 * POST /flows/sessions/:sessionId/answer
 * Submit an answer for a flow session
 */
router.post('/flows/sessions/:sessionId/answer', flow_controller_1.submitAnswer);
/**
 * GET /flows/sessions/:sessionId
 * Get session details (for resuming)
 */
router.get('/flows/sessions/:sessionId', flow_controller_1.getSession);
/**
 * POST /flows/sessions/:sessionId/complete
 * Complete a flow session manually
 */
router.post('/flows/sessions/:sessionId/complete', flow_controller_1.completeFlow);
// ==================== ADMIN ROUTES ====================
// Note: Authentication is handled by API Gateway
// These routes will be protected at the gateway level
/**
 * POST /admin/flows
 * Create new flow
 */
router.post('/admin/flows', flow_controller_1.createFlow);
/**
 * PATCH /admin/flows/:id
 * Update existing flow
 */
router.patch('/admin/flows/:id', flow_controller_1.updateFlow);
/**
 * DELETE /admin/flows/:id
 * Delete flow (soft delete)
 */
router.delete('/admin/flows/:id', flow_controller_1.deleteFlow);
exports.default = router;
