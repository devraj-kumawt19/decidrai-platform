"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trackInteractionHandler = trackInteractionHandler;
exports.getUserInteractionsHandler = getUserInteractionsHandler;
const interaction_service_1 = require("../services/interaction.service");
const user_service_1 = require("../services/user.service");
/**
 * POST /auth/interactions - Track a user interaction
 */
async function trackInteractionHandler(req, res) {
    try {
        const { userId: clerkUserId } = req.auth;
        const { sessionId, eventType, toolId, flowId, source, metadata } = req.body;
        if (!sessionId || !eventType) {
            return res.status(400).json({
                success: false,
                error: "sessionId and eventType are required"
            });
        }
        // Validate eventType
        const validEventTypes = ["view", "click", "save", "compare", "flow_start", "flow_complete"];
        if (!validEventTypes.includes(eventType)) {
            return res.status(400).json({
                success: false,
                error: `eventType must be one of: ${validEventTypes.join(", ")}`
            });
        }
        // Get internal user ID
        const user = await (0, user_service_1.getUserByClerkId)(clerkUserId);
        const interaction = await (0, interaction_service_1.trackInteraction)({
            userId: user?._id?.toString(),
            sessionId,
            eventType,
            toolId,
            flowId,
            source,
            metadata,
            userAgent: req.get("user-agent"),
            ipAddress: req.ip
        });
        return res.status(201).json({
            success: true,
            data: { id: interaction._id }
        });
    }
    catch (error) {
        console.error("[Interaction Controller] Error tracking interaction:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to track interaction"
        });
    }
}
/**
 * GET /auth/interactions - Get user's interactions
 */
async function getUserInteractionsHandler(req, res) {
    try {
        const { userId: clerkUserId } = req.auth;
        const { eventType, toolId, page, limit } = req.query;
        // Get internal user ID
        const user = await (0, user_service_1.getUserByClerkId)(clerkUserId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: "User not found"
            });
        }
        const result = await (0, interaction_service_1.getUserInteractions)(user._id.toString(), {
            eventType: eventType,
            toolId: toolId
        }, {
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 50
        });
        return res.json({
            success: true,
            data: result.interactions,
            pagination: result.pagination
        });
    }
    catch (error) {
        console.error("[Interaction Controller] Error fetching interactions:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to fetch interactions"
        });
    }
}
