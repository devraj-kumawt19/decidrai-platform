"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const db_1 = require("db");
const logger_1 = require("logger");
const clerkWebhook_1 = __importDefault(require("./routes/clerkWebhook"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const swagger_1 = require("./swagger");
dotenv_1.default.config();
const app = (0, express_1.default)();
// Security & Standard Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use((0, logger_1.createRequestLogger)('auth-service'));
// Webhooks (before body parsing)
app.use("/webhooks", clerkWebhook_1.default);
// Body Parsing
app.use(express_1.default.json());
// Swagger Documentation
app.use("/api-docs", swagger_1.swaggerUi.serve, swagger_1.swaggerUi.setup(swagger_1.specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: "DecidrAI Auth Service API"
}));
// Routes
app.use("/auth", auth_routes_1.default);
app.use("/admin", admin_routes_1.default);
// Health Check
app.get("/health", async (_, res) => {
    try {
        const dbState = await (0, db_1.connectMongo)(process.env.MONGODB_URI, process.env.MONGODB_DB_NAME || "decidrai");
        // connectMongo returns void, but we can assume connected if no error
        res.json({
            status: "ok",
            service: "auth-service",
            db: "connected",
            docs: "/api-docs"
        });
    }
    catch (err) {
        res.status(500).json({ status: "error", message: "DB connection failed" });
    }
});
// Error Handling
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        error: 'Route not found'
    });
});
app.use((err, req, res, next) => {
    console.error('[Auth Error]:', err);
    res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Internal server error'
    });
});
if (!process.env.CLERK_WEBHOOK_SECRET) {
    throw new Error("Missing CLERK_WEBHOOK_SECRET");
}
const PORT = process.env.PORT || 5002;
app.listen(PORT, async () => {
    try {
        await (0, db_1.connectMongo)(process.env.MONGODB_URI, process.env.MONGODB_DB_NAME || "decidrai");
        console.log(`🚀 Auth service running on port ${PORT}`);
        console.log(`📚 API Docs: http://localhost:${PORT}/api-docs`);
    }
    catch (err) {
        console.error("Failed to connect to DB on startup:", err);
        process.exit(1);
    }
});
