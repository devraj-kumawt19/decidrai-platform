"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trackInteraction = trackInteraction;
exports.getUserInteractions = getUserInteractions;
exports.getToolInteractionStats = getToolInteractionStats;
exports.getRecentInteractions = getRecentInteractions;
// services/auth-service/src/services/interaction.service.ts
const Interaction_1 = require("../models/Interaction");
const mongoose_1 = require("mongoose");
async function trackInteraction(data) {
    const interaction = new Interaction_1.Interaction({
        userId: data.userId ? new mongoose_1.Types.ObjectId(data.userId) : undefined,
        sessionId: data.sessionId,
        eventType: data.eventType,
        toolId: data.toolId ? new mongoose_1.Types.ObjectId(data.toolId) : undefined,
        flowId: data.flowId ? new mongoose_1.Types.ObjectId(data.flowId) : undefined,
        source: data.source,
        metadata: data.metadata,
        userAgent: data.userAgent,
        ipAddress: data.ipAddress,
    });
    return interaction.save();
}
async function getUserInteractions(userId, filters = {}, pagination = {}) {
    const { page = 1, limit = 50 } = pagination;
    const skip = (page - 1) * limit;
    const query = {
        userId: new mongoose_1.Types.ObjectId(userId)
    };
    if (filters.eventType) {
        query.eventType = filters.eventType;
    }
    if (filters.toolId) {
        query.toolId = new mongoose_1.Types.ObjectId(filters.toolId);
    }
    if (filters.startDate || filters.endDate) {
        query.createdAt = {};
        if (filters.startDate) {
            query.createdAt.$gte = filters.startDate;
        }
        if (filters.endDate) {
            query.createdAt.$lte = filters.endDate;
        }
    }
    const [interactions, total] = await Promise.all([
        Interaction_1.Interaction.find(query)
            .populate("toolId", "name slug logo_url")
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 }),
        Interaction_1.Interaction.countDocuments(query)
    ]);
    return {
        interactions,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
}
// Analytics helper functions
async function getToolInteractionStats(toolId) {
    const stats = await Interaction_1.Interaction.aggregate([
        { $match: { toolId: new mongoose_1.Types.ObjectId(toolId) } },
        {
            $group: {
                _id: "$eventType",
                count: { $sum: 1 }
            }
        }
    ]);
    return stats.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
    }, {});
}
async function getRecentInteractions(limit = 100) {
    return Interaction_1.Interaction.find()
        .populate("userId", "name email")
        .populate("toolId", "name slug")
        .sort({ createdAt: -1 })
        .limit(limit);
}
