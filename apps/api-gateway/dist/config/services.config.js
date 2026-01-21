"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GATEWAY_CONFIG = exports.RATE_LIMITS = exports.SERVICES = void 0;
/**
 * Microservices configuration
 */
const normalizeUrl = (url, defaultUrl) => {
    if (!url)
        return defaultUrl || '';
    if (url.startsWith('http'))
        return url;
    return `https://${url}`;
};
exports.SERVICES = {
    auth: {
        name: 'auth-service',
        get url() { return normalizeUrl(process.env.AUTH_SERVICE_URL, 'http://localhost:5002'); },
        healthPath: '/health'
    },
    tool: {
        name: 'tool-service',
        get url() { return normalizeUrl(process.env.TOOL_SERVICE_URL, 'http://localhost:5003'); },
        healthPath: '/health'
    },
    flow: {
        name: 'flow-service',
        get url() { return normalizeUrl(process.env.FLOW_SERVICE_URL, 'http://localhost:5004'); },
        healthPath: '/health'
    },
    comparison: {
        name: 'comparison-service',
        get url() { return normalizeUrl(process.env.COMPARISON_SERVICE_URL, 'http://localhost:5005'); },
        healthPath: '/health'
    },
    recommendation: {
        name: 'recommendation-service',
        get url() { return normalizeUrl(process.env.RECOMMENDATION_SERVICE_URL, 'http://localhost:5001'); },
        healthPath: '/health'
    }
};
/**
 * Rate limiting configuration
 */
exports.RATE_LIMITS = {
    default: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100 // 100 requests per window
    },
    ai: {
        windowMs: 60 * 1000, // 1 minute
        max: 20 // 20 requests per minute for AI endpoints
    },
    auth: {
        windowMs: 15 * 60 * 1000,
        max: 50 // 50 auth requests per 15 minutes
    }
};
/**
 * Gateway configuration
 */
exports.GATEWAY_CONFIG = {
    port: process.env.PORT || 4000,
    // Allow all origins in development for API playground testing
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || '*',
    trustProxy: process.env.TRUST_PROXY === 'true'
};
