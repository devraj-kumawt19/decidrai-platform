"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRateLimiter = exports.aiRateLimiter = exports.defaultRateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const services_config_1 = require("../config/services.config");
/**
 * Default rate limiter for general API access
 */
exports.defaultRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: services_config_1.RATE_LIMITS.default.windowMs,
    max: services_config_1.RATE_LIMITS.default.max,
    message: {
        success: false,
        error: 'Too many requests, please try again later.',
        retryAfter: Math.ceil(services_config_1.RATE_LIMITS.default.windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        // Use X-Forwarded-For if behind proxy, otherwise use IP
        return req.headers['x-forwarded-for']?.toString().split(',')[0] ||
            req.ip ||
            'unknown';
    }
});
/**
 * Stricter rate limiter for AI-powered endpoints
 */
exports.aiRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: services_config_1.RATE_LIMITS.ai.windowMs,
    max: services_config_1.RATE_LIMITS.ai.max,
    message: {
        success: false,
        error: 'AI rate limit exceeded. Please wait before making more requests.',
        retryAfter: Math.ceil(services_config_1.RATE_LIMITS.ai.windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false
});
/**
 * Rate limiter for auth endpoints
 */
exports.authRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: services_config_1.RATE_LIMITS.auth.windowMs,
    max: services_config_1.RATE_LIMITS.auth.max,
    message: {
        success: false,
        error: 'Too many authentication attempts.',
        retryAfter: Math.ceil(services_config_1.RATE_LIMITS.auth.windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false
});
