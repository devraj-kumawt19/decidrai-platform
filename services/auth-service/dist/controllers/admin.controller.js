"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllUsersHandler = getAllUsersHandler;
exports.getUserByIdHandler = getUserByIdHandler;
exports.updateUserRoleHandler = updateUserRoleHandler;
exports.getUserAnalyticsHandler = getUserAnalyticsHandler;
const user_service_1 = require("../services/user.service");
const interaction_service_1 = require("../services/interaction.service");
const User_1 = require("../models/User");
/**
 * GET /admin/users - Get all users (paginated)
 */
async function getAllUsersHandler(req, res) {
    try {
        const { role, search, page, limit } = req.query;
        const result = await (0, user_service_1.getAllUsers)({
            role: role,
            search: search
        }, {
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 20
        });
        return res.json({
            success: true,
            data: result.users,
            pagination: result.pagination
        });
    }
    catch (error) {
        console.error("[Admin Controller] Error fetching users:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to fetch users"
        });
    }
}
/**
 * GET /admin/users/:id - Get user by ID
 */
async function getUserByIdHandler(req, res) {
    try {
        const { id } = req.params;
        const user = await (0, user_service_1.getUserById)(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: "User not found"
            });
        }
        return res.json({
            success: true,
            data: user
        });
    }
    catch (error) {
        console.error("[Admin Controller] Error fetching user:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to fetch user"
        });
    }
}
/**
 * PATCH /admin/users/:id/role - Update user role
 */
async function updateUserRoleHandler(req, res) {
    try {
        const { id } = req.params;
        const { role } = req.body;
        if (!role || !["user", "admin"].includes(role)) {
            return res.status(400).json({
                success: false,
                error: "role must be 'user' or 'admin'"
            });
        }
        // Get user by MongoDB ID first
        const existingUser = await (0, user_service_1.getUserById)(id);
        if (!existingUser) {
            return res.status(404).json({
                success: false,
                error: "User not found"
            });
        }
        const user = await (0, user_service_1.upgradeUserRole)(existingUser.clerkUserId, role);
        return res.json({
            success: true,
            data: user
        });
    }
    catch (error) {
        console.error("[Admin Controller] Error updating user role:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to update user role"
        });
    }
}
/**
 * GET /admin/analytics/users - Get user analytics
 */
async function getUserAnalyticsHandler(req, res) {
    try {
        // Get basic user stats
        const [totalUsers, adminCount, recentInteractions] = await Promise.all([
            User_1.User.countDocuments(),
            User_1.User.countDocuments({ role: "admin" }),
            (0, interaction_service_1.getRecentInteractions)(10)
        ]);
        // Get users by experience level
        const experienceLevelStats = await User_1.User.aggregate([
            { $match: { "profile.experienceLevel": { $exists: true } } },
            {
                $group: {
                    _id: "$profile.experienceLevel",
                    count: { $sum: 1 }
                }
            }
        ]);
        // Get recent signups (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentSignups = await User_1.User.countDocuments({
            createdAt: { $gte: sevenDaysAgo }
        });
        return res.json({
            success: true,
            data: {
                totalUsers,
                adminCount,
                recentSignups,
                experienceLevelStats,
                recentInteractions: recentInteractions.map(i => ({
                    id: i._id,
                    eventType: i.eventType,
                    createdAt: i.createdAt
                }))
            }
        });
    }
    catch (error) {
        console.error("[Admin Controller] Error fetching analytics:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to fetch analytics"
        });
    }
}
