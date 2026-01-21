"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.upgradeUserRole = upgradeUserRole;
exports.upsertUser = upsertUser;
exports.deleteUser = deleteUser;
exports.getUserByClerkId = getUserByClerkId;
exports.getUserById = getUserById;
exports.updateUserProfile = updateUserProfile;
exports.getSavedTools = getSavedTools;
exports.saveTool = saveTool;
exports.unsaveTool = unsaveTool;
exports.getAiStack = getAiStack;
exports.addToAiStack = addToAiStack;
exports.removeFromAiStack = removeFromAiStack;
exports.getAllUsers = getAllUsers;
const User_1 = require("../models/User");
const mongoose_1 = require("mongoose");
// ==================== ROLE MANAGEMENT ====================
async function upgradeUserRole(clerkUserId, role) {
    return User_1.User.findOneAndUpdate({ clerkUserId }, { role }, { new: true });
}
// ==================== USER CRUD ====================
async function upsertUser(data) {
    return User_1.User.findOneAndUpdate({ clerkUserId: data.id }, {
        clerkUserId: data.id,
        email: (Array.isArray(data.email_addresses) && data.email_addresses.length > 0)
            ? data.email_addresses[0].email_address
            : null,
        name: `${data.first_name ?? ""} ${data.last_name ?? ""}`.trim(),
        image: data.image_url,
    }, { upsert: true, new: true });
}
async function deleteUser(clerkUserId) {
    return User_1.User.findOneAndDelete({ clerkUserId });
}
async function getUserByClerkId(clerkUserId) {
    return User_1.User.findOne({ clerkUserId });
}
async function getUserById(userId) {
    return User_1.User.findById(userId);
}
async function updateUserProfile(clerkUserId, updates) {
    const updateData = {};
    if (updates.name !== undefined) {
        updateData.name = updates.name;
    }
    if (updates.bio !== undefined) {
        updateData["profile.bio"] = updates.bio;
    }
    if (updates.experienceLevel !== undefined) {
        updateData["profile.experienceLevel"] = updates.experienceLevel;
    }
    if (updates.interests !== undefined) {
        updateData["profile.interests"] = updates.interests;
    }
    if (updates.preferences) {
        if (updates.preferences.emailNotifications !== undefined) {
            updateData["preferences.emailNotifications"] = updates.preferences.emailNotifications;
        }
        if (updates.preferences.theme !== undefined) {
            updateData["preferences.theme"] = updates.preferences.theme;
        }
    }
    return User_1.User.findOneAndUpdate({ clerkUserId }, { $set: updateData }, { new: true });
}
// ==================== SAVED TOOLS MANAGEMENT ====================
async function getSavedTools(clerkUserId) {
    const user = await User_1.User.findOne({ clerkUserId })
        .select("savedTools")
        .populate("savedTools.toolId");
    return user?.savedTools || [];
}
async function saveTool(clerkUserId, toolId, notes) {
    // Check if tool is already saved
    const user = await User_1.User.findOne({
        clerkUserId,
        "savedTools.toolId": new mongoose_1.Types.ObjectId(toolId)
    });
    if (user) {
        // Update notes if tool already saved
        return User_1.User.findOneAndUpdate({ clerkUserId, "savedTools.toolId": new mongoose_1.Types.ObjectId(toolId) }, { $set: { "savedTools.$.notes": notes } }, { new: true });
    }
    // Add new saved tool
    return User_1.User.findOneAndUpdate({ clerkUserId }, {
        $push: {
            savedTools: {
                toolId: new mongoose_1.Types.ObjectId(toolId),
                savedAt: new Date(),
                notes
            }
        }
    }, { new: true });
}
async function unsaveTool(clerkUserId, toolId) {
    return User_1.User.findOneAndUpdate({ clerkUserId }, {
        $pull: {
            savedTools: { toolId: new mongoose_1.Types.ObjectId(toolId) }
        }
    }, { new: true });
}
// ==================== AI STACK MANAGEMENT ====================
async function getAiStack(clerkUserId) {
    const user = await User_1.User.findOne({ clerkUserId })
        .select("aiStack")
        .populate("aiStack.toolId");
    return user?.aiStack || [];
}
async function addToAiStack(clerkUserId, toolId, category, notes) {
    // Check if tool is already in stack
    const user = await User_1.User.findOne({
        clerkUserId,
        "aiStack.toolId": new mongoose_1.Types.ObjectId(toolId)
    });
    if (user) {
        // Update category/notes if already in stack
        return User_1.User.findOneAndUpdate({ clerkUserId, "aiStack.toolId": new mongoose_1.Types.ObjectId(toolId) }, {
            $set: {
                "aiStack.$.category": category,
                "aiStack.$.notes": notes
            }
        }, { new: true });
    }
    // Add new stack item
    return User_1.User.findOneAndUpdate({ clerkUserId }, {
        $push: {
            aiStack: {
                toolId: new mongoose_1.Types.ObjectId(toolId),
                category,
                notes,
                addedAt: new Date()
            }
        }
    }, { new: true });
}
async function removeFromAiStack(clerkUserId, toolId) {
    return User_1.User.findOneAndUpdate({ clerkUserId }, {
        $pull: {
            aiStack: { toolId: new mongoose_1.Types.ObjectId(toolId) }
        }
    }, { new: true });
}
async function getAllUsers(filters = {}, pagination = {}) {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;
    const query = {};
    if (filters.role) {
        query.role = filters.role;
    }
    if (filters.search) {
        query.$or = [
            { name: { $regex: filters.search, $options: "i" } },
            { email: { $regex: filters.search, $options: "i" } }
        ];
    }
    const [users, total] = await Promise.all([
        User_1.User.find(query)
            .select("-savedTools -aiStack")
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 }),
        User_1.User.countDocuments(query)
    ]);
    return {
        users,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
}
