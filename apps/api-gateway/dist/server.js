"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const logger_1 = require("logger");
const services_config_1 = require("./config/services.config");
const auth_middleware_1 = require("./middleware/auth.middleware");
const rateLimiter_middleware_1 = require("./middleware/rateLimiter.middleware");
const errorHandler_middleware_1 = require("./middleware/errorHandler.middleware");
const proxy_routes_1 = __importDefault(require("./routes/proxy.routes"));
const test_routes_1 = __importDefault(require("./routes/test.routes"));
const app = (0, express_1.default)();
// ================================
// SECURITY & PARSING MIDDLEWARE
// ================================
// Security headers
app.use((0, helmet_1.default)({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));
// CORS
app.use((0, cors_1.default)({
    origin: services_config_1.GATEWAY_CONFIG.corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
// Body parsing
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Request logging (using shared logger package)
app.use((0, logger_1.createRequestLogger)('api-gateway'));
// Trust proxy (for rate limiting behind reverse proxy)
if (services_config_1.GATEWAY_CONFIG.trustProxy) {
    app.set('trust proxy', 1);
}
// ================================
// PUBLIC ROUTES (No Auth Required)
// ================================
// Health check
app.get("/health", (_, res) => {
    res.json({
        status: "ok",
        service: "api-gateway",
        port: services_config_1.GATEWAY_CONFIG.port,
        timestamp: new Date().toISOString()
    });
});
// Test routes (for debugging)
app.use("/test", test_routes_1.default);
// ================================
// RATE LIMITED API ROUTES
// ================================
// Apply default rate limiting to all /api routes
app.use("/api", rateLimiter_middleware_1.defaultRateLimiter);
// Proxy routes to microservices
app.use("/api", proxy_routes_1.default);
// ================================
// PROTECTED ROUTES (Legacy)
// ================================
app.get("/protected", auth_middleware_1.authMiddleware, (req, res) => {
    res.json({
        message: "You are authenticated",
        user: req.user
    });
});
// ================================
// ERROR HANDLING
// ================================
app.use(errorHandler_middleware_1.notFoundHandler);
app.use(errorHandler_middleware_1.errorHandler);
// ================================
// START SERVER
// ================================
const PORT = services_config_1.GATEWAY_CONFIG.port;
app.listen(PORT, () => {
    console.log(`\n🚀 API Gateway running on port ${PORT}`);
    console.log(`📍 Health: http://localhost:${PORT}/health`);
    console.log(`📍 Services: http://localhost:${PORT}/test/services`);
    console.log(`📍 API: http://localhost:${PORT}/api/*\n`);
});
exports.default = app;
