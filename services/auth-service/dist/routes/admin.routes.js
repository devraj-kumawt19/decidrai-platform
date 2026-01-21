"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// services/auth-service/src/routes/admin.routes.ts
const express_1 = __importDefault(require("express"));
const express_2 = require("@clerk/express");
const admin_controller_1 = require("../controllers/admin.controller");
const user_service_1 = require("../services/user.service");
const router = express_1.default.Router();
// Middleware to require admin role
async function requireAdmin(req, res, next) {
    try {
        const { userId } = req.auth;
        const user = await (0, user_service_1.getUserByClerkId)(userId);
        if (!user || user.role !== "admin") {
            return res.status(403).json({
                success: false,
                error: "Admin access required"
            });
        }
        next();
    }
    catch (error) {
        console.error("[Admin Middleware] Error:", error);
        return res.status(500).json({
            success: false,
            error: "Authorization failed"
        });
    }
}
// ==================== ADMIN USER MANAGEMENT ====================
/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Get all users (paginated)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [user, admin]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 */
router.get("/users", (0, express_2.requireAuth)(), requireAdmin, admin_controller_1.getAllUsersHandler);
/**
 * @swagger
 * /admin/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.get("/users/:id", (0, express_2.requireAuth)(), requireAdmin, admin_controller_1.getUserByIdHandler);
/**
 * @swagger
 * /admin/users/{id}/role:
 *   patch:
 *     summary: Update user role
 *     tags: [Admin]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 */
router.patch("/users/:id/role", (0, express_2.requireAuth)(), requireAdmin, admin_controller_1.updateUserRoleHandler);
// ==================== ADMIN ANALYTICS ====================
/**
 * @swagger
 * /admin/analytics/users:
 *   get:
 *     summary: Get user analytics
 *     tags: [Admin]
 */
router.get("/analytics/users", (0, express_2.requireAuth)(), requireAdmin, admin_controller_1.getUserAnalyticsHandler);
exports.default = router;
