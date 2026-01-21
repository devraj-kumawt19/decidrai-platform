"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const axios_1 = __importDefault(require("axios"));
const services_config_1 = require("../config/services.config");
const router = (0, express_1.Router)();
/**
 * GET /test/services
 * Check health of all services
 */
router.get('/services', async (req, res) => {
    const results = {};
    await Promise.all(Object.entries(services_config_1.SERVICES).map(async ([name, config]) => {
        const startTime = Date.now();
        try {
            const response = await axios_1.default.get(`${config.url}${config.healthPath}`, {
                timeout: 5000
            });
            results[name] = {
                status: response.data.status || 'ok',
                latency: Date.now() - startTime
            };
        }
        catch (error) {
            results[name] = {
                status: 'error',
                latency: Date.now() - startTime,
                error: axios_1.default.isAxiosError(error)
                    ? error.code || error.message
                    : 'Unknown error'
            };
        }
    }));
    const allHealthy = Object.values(results).every(r => r.status !== 'error');
    res.status(allHealthy ? 200 : 503).json({
        success: allHealthy,
        gateway: 'healthy',
        services: results,
        timestamp: new Date().toISOString()
    });
});
/**
 * GET /test/service/:name
 * Check health of a specific service
 */
router.get('/service/:name', async (req, res) => {
    const { name } = req.params;
    if (!services_config_1.SERVICES[name]) {
        res.status(404).json({
            success: false,
            error: `Unknown service: ${name}`,
            availableServices: Object.keys(services_config_1.SERVICES)
        });
        return;
    }
    const config = services_config_1.SERVICES[name];
    const startTime = Date.now();
    try {
        const response = await axios_1.default.get(`${config.url}${config.healthPath}`, {
            timeout: 5000
        });
        res.json({
            success: true,
            service: name,
            status: response.data.status || 'ok',
            data: response.data,
            latency: Date.now() - startTime
        });
    }
    catch (error) {
        res.status(503).json({
            success: false,
            service: name,
            status: 'error',
            error: axios_1.default.isAxiosError(error) ? error.code || error.message : 'Unknown error',
            latency: Date.now() - startTime
        });
    }
});
/**
 * GET /test/echo
 * Echo back request details (for debugging)
 */
router.all('/echo', (req, res) => {
    res.json({
        success: true,
        request: {
            method: req.method,
            path: req.path,
            query: req.query,
            body: req.body,
            headers: {
                'content-type': req.headers['content-type'],
                'authorization': req.headers.authorization ? '[PRESENT]' : '[MISSING]',
                'user-agent': req.headers['user-agent'],
                'x-forwarded-for': req.headers['x-forwarded-for']
            },
            user: req.user || null,
            ip: req.ip
        },
        timestamp: new Date().toISOString()
    });
});
/**
 * GET /test/protected
 * Test protected route (requires auth)
 */
router.get('/protected', (req, res) => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            error: 'Not authenticated',
            message: 'This endpoint requires authentication'
        });
        return;
    }
    res.json({
        success: true,
        message: 'You are authenticated!',
        user: req.user
    });
});
exports.default = router;
