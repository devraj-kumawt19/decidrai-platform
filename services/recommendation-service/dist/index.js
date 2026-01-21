"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const mongoose_1 = __importDefault(require("mongoose"));
const db_1 = require("db");
const db_2 = require("db");
const recommendation_routes_1 = __importDefault(require("./routes/recommendation.routes"));
const logger_1 = require("logger");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5001;
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use((0, logger_1.createRequestLogger)('recommendation-service'));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Health check
app.get('/health', async (_, res) => {
    try {
        const mongoStatus = mongoose_1.default.connection.readyState;
        let redisStatus = 'disconnected';
        try {
            const redis = (0, db_2.getRedisClient)();
            await redis.ping();
            redisStatus = 'connected';
        }
        catch (error) {
            redisStatus = 'error';
        }
        res.json({
            status: 'ok',
            service: 'recommendation-service',
            port: PORT,
            mongodb: mongoStatus === 1 ? 'connected' : 'disconnected',
            redis: redisStatus,
            gemini: process.env.GEMINI_API_KEY ? 'configured' : 'not configured',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        res.status(500).json({
            status: 'error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Redis test route (keep for compatibility)
app.get('/redis-test', async (_, res) => {
    try {
        const redis = (0, db_2.getRedisClient)();
        await redis.set('rec-test', 'hello');
        const value = await redis.get('rec-test');
        res.json({ redisWorking: value === 'hello' });
    }
    catch (err) {
        res.status(500).json({ status: 'error', message: 'Redis operation failed' });
    }
});
// Recommendation routes
app.use('/', recommendation_routes_1.default);
// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});
// Global error handler
app.use((err, req, res, next) => {
    console.error('[Server Error]:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});
async function startServer() {
    try {
        // Connect to MongoDB
        console.log('🔌 Connecting to MongoDB...');
        await (0, db_1.connectMongo)(process.env.MONGODB_URI, process.env.MONGODB_DB_NAME || 'decidrai_recommendations');
        console.log('✅ MongoDB connected');
        // Initialize Redis client
        console.log('🔌 Connecting to Redis...');
        const redis = (0, db_2.getRedisClient)();
        await redis.ping();
        console.log('✅ Redis connected');
        // Check Gemini configuration
        if (process.env.GEMINI_API_KEY) {
            console.log('✅ Gemini AI configured');
        }
        else {
            console.log('⚠️ Gemini AI not configured (using template explanations)');
        }
        // Start Express server
        app.listen(PORT, () => {
            console.log(`\n🚀 Recommendation Service running on port ${PORT}`);
            console.log(`📍 Health check: http://localhost:${PORT}/health`);
            console.log(`📍 Recommend: POST http://localhost:${PORT}/recommend`);
            console.log(`📍 Session: GET http://localhost:${PORT}/recommend/session/:id\n`);
        });
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}
startServer();
