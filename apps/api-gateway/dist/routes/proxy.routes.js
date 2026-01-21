"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const axios_1 = __importDefault(require("axios"));
const services_config_1 = require("../config/services.config");
const auth_middleware_1 = require("../middleware/auth.middleware");
const rateLimiter_middleware_1 = require("../middleware/rateLimiter.middleware");
const router = (0, express_1.Router)();
/**
 * Helper to proxy requests to a service
 */
async function proxyRequest(req, res, serviceUrl, path) {
    try {
        const url = `${serviceUrl}${path}`;
        const response = await (0, axios_1.default)({
            method: req.method,
            url,
            data: req.body,
            params: req.query,
            headers: {
                'Content-Type': 'application/json',
                // Forward auth header if present
                ...(req.headers.authorization && {
                    'Authorization': req.headers.authorization
                }),
                // Forward user info if authenticated
                ...(req.user && {
                    'X-User-Id': req.user.userId,
                    'X-User-Role': req.user.role
                })
            },
            timeout: 30000, // 30 second timeout
            validateStatus: () => true // Don't throw on any status
        });
        res.status(response.status).json(response.data);
    }
    catch (error) {
        console.error(`[Proxy Error] ${req.method} ${path}:`, error);
        if (axios_1.default.isAxiosError(error)) {
            if (error.code === 'ECONNREFUSED') {
                res.status(503).json({
                    success: false,
                    error: 'Service unavailable',
                    message: 'The requested service is not running'
                });
                return;
            }
            if (error.code === 'ETIMEDOUT') {
                res.status(504).json({
                    success: false,
                    error: 'Gateway timeout',
                    message: 'The service took too long to respond'
                });
                return;
            }
        }
        res.status(500).json({
            success: false,
            error: 'Internal gateway error'
        });
    }
}
// ================================
// TOOL SERVICE ROUTES
// ================================
// Public routes
router.get('/tools', (req, res) => proxyRequest(req, res, services_config_1.SERVICES.tool.url, '/tools'));
// Search route MUST come before :slug route
router.get('/tools/search', (req, res) => proxyRequest(req, res, services_config_1.SERVICES.tool.url, '/tools/search'));
router.get('/tools/:slug', (req, res) => proxyRequest(req, res, services_config_1.SERVICES.tool.url, `/tools/${req.params.slug}`));
router.get('/tools/:slug/related', (req, res) => proxyRequest(req, res, services_config_1.SERVICES.tool.url, `/tools/${req.params.slug}/related`));
// Admin routes (protected)
router.post('/admin/tools', auth_middleware_1.authMiddleware, (req, res) => proxyRequest(req, res, services_config_1.SERVICES.tool.url, '/admin/tools'));
router.patch('/admin/tools/:id', auth_middleware_1.authMiddleware, (req, res) => proxyRequest(req, res, services_config_1.SERVICES.tool.url, `/admin/tools/${req.params.id}`));
router.delete('/admin/tools/:id', auth_middleware_1.authMiddleware, (req, res) => proxyRequest(req, res, services_config_1.SERVICES.tool.url, `/admin/tools/${req.params.id}`));
// ================================
// FLOW SERVICE ROUTES
// ================================
// Public routes
router.get('/flows', (req, res) => proxyRequest(req, res, services_config_1.SERVICES.flow.url, '/flows'));
// Session routes MUST come before :slug to avoid matching "sessions" as a slug
router.get('/flows/sessions/:sessionId', (req, res) => proxyRequest(req, res, services_config_1.SERVICES.flow.url, `/flows/sessions/${req.params.sessionId}`));
router.post('/flows/sessions/:sessionId/answer', (req, res) => proxyRequest(req, res, services_config_1.SERVICES.flow.url, `/flows/sessions/${req.params.sessionId}/answer`));
router.post('/flows/sessions/:sessionId/complete', (req, res) => proxyRequest(req, res, services_config_1.SERVICES.flow.url, `/flows/sessions/${req.params.sessionId}/complete`));
// Slug routes
router.get('/flows/:slug', (req, res) => proxyRequest(req, res, services_config_1.SERVICES.flow.url, `/flows/${req.params.slug}`));
router.post('/flows/:slug/start', (req, res) => proxyRequest(req, res, services_config_1.SERVICES.flow.url, `/flows/${req.params.slug}/start`));
// Admin routes (protected)
router.post('/admin/flows', auth_middleware_1.authMiddleware, (req, res) => proxyRequest(req, res, services_config_1.SERVICES.flow.url, '/admin/flows'));
router.patch('/admin/flows/:id', auth_middleware_1.authMiddleware, (req, res) => proxyRequest(req, res, services_config_1.SERVICES.flow.url, `/admin/flows/${req.params.id}`));
router.delete('/admin/flows/:id', auth_middleware_1.authMiddleware, (req, res) => proxyRequest(req, res, services_config_1.SERVICES.flow.url, `/admin/flows/${req.params.id}`));
// ================================
// COMPARISON SERVICE ROUTES
// ================================
router.get('/compare', rateLimiter_middleware_1.aiRateLimiter, (req, res) => proxyRequest(req, res, services_config_1.SERVICES.comparison.url, '/compare'));
router.post('/compare', rateLimiter_middleware_1.aiRateLimiter, (req, res) => proxyRequest(req, res, services_config_1.SERVICES.comparison.url, '/compare'));
router.get('/compare/popular', (req, res) => proxyRequest(req, res, services_config_1.SERVICES.comparison.url, '/compare/popular'));
// ================================
// RECOMMENDATION SERVICE ROUTES
// ================================
router.post('/recommend', rateLimiter_middleware_1.aiRateLimiter, (req, res) => proxyRequest(req, res, services_config_1.SERVICES.recommendation.url, '/recommend'));
router.get('/recommend/session/:sessionId', rateLimiter_middleware_1.aiRateLimiter, (req, res) => proxyRequest(req, res, services_config_1.SERVICES.recommendation.url, `/recommend/session/${req.params.sessionId}`));
// ================================
// AUTH SERVICE ROUTES
// ================================
// Profile endpoints
router.get('/auth/me', auth_middleware_1.authMiddleware, (req, res) => proxyRequest(req, res, services_config_1.SERVICES.auth.url, '/auth/me'));
router.patch('/auth/me', auth_middleware_1.authMiddleware, (req, res) => proxyRequest(req, res, services_config_1.SERVICES.auth.url, '/auth/me'));
// Saved tools endpoints
router.get('/auth/me/saved-tools', auth_middleware_1.authMiddleware, (req, res) => proxyRequest(req, res, services_config_1.SERVICES.auth.url, '/auth/me/saved-tools'));
router.post('/auth/me/saved-tools/:toolId', auth_middleware_1.authMiddleware, (req, res) => proxyRequest(req, res, services_config_1.SERVICES.auth.url, `/auth/me/saved-tools/${req.params.toolId}`));
router.delete('/auth/me/saved-tools/:toolId', auth_middleware_1.authMiddleware, (req, res) => proxyRequest(req, res, services_config_1.SERVICES.auth.url, `/auth/me/saved-tools/${req.params.toolId}`));
// AI Stack endpoints
router.get('/auth/me/ai-stack', auth_middleware_1.authMiddleware, (req, res) => proxyRequest(req, res, services_config_1.SERVICES.auth.url, '/auth/me/ai-stack'));
router.post('/auth/me/ai-stack', auth_middleware_1.authMiddleware, (req, res) => proxyRequest(req, res, services_config_1.SERVICES.auth.url, '/auth/me/ai-stack'));
router.delete('/auth/me/ai-stack/:toolId', auth_middleware_1.authMiddleware, (req, res) => proxyRequest(req, res, services_config_1.SERVICES.auth.url, `/auth/me/ai-stack/${req.params.toolId}`));
// Interaction endpoints
router.post('/auth/interactions', auth_middleware_1.authMiddleware, (req, res) => proxyRequest(req, res, services_config_1.SERVICES.auth.url, '/auth/interactions'));
router.get('/auth/interactions', auth_middleware_1.authMiddleware, (req, res) => proxyRequest(req, res, services_config_1.SERVICES.auth.url, '/auth/interactions'));
// ================================
// ADMIN ROUTES (Auth Service)
// ================================
router.get('/admin/users', auth_middleware_1.authMiddleware, (req, res) => proxyRequest(req, res, services_config_1.SERVICES.auth.url, '/admin/users'));
router.get('/admin/users/:id', auth_middleware_1.authMiddleware, (req, res) => proxyRequest(req, res, services_config_1.SERVICES.auth.url, `/admin/users/${req.params.id}`));
router.patch('/admin/users/:id/role', auth_middleware_1.authMiddleware, (req, res) => proxyRequest(req, res, services_config_1.SERVICES.auth.url, `/admin/users/${req.params.id}/role`));
router.get('/admin/analytics/users', auth_middleware_1.authMiddleware, (req, res) => proxyRequest(req, res, services_config_1.SERVICES.auth.url, '/admin/analytics/users'));
exports.default = router;
