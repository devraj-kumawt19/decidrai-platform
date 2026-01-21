"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = getMe;
exports.updateMe = updateMe;
exports.getSavedToolsHandler = getSavedToolsHandler;
exports.saveToolHandler = saveToolHandler;
exports.unsaveToolHandler = unsaveToolHandler;
exports.getAiStackHandler = getAiStackHandler;
exports.addToAiStackHandler = addToAiStackHandler;
exports.removeFromAiStackHandler = removeFromAiStackHandler;
exports.deleteMe = deleteMe;
const user_service_1 = require("../services/user.service");
// ==================== PROFILE ENDPOINTS ====================
/**
 * GET /auth/me - Get current user profile
 */
async function getMe(req, res) {
    try {
        const { userId } = req.auth;
        const user = await (0, user_service_1.getUserByClerkId)(userId);
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
        console.error("[User Controller] Error fetching user:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to fetch user"
        });
    }
}
/**
 * PATCH /auth/me - Update current user profile
 */
async function updateMe(req, res) {
    try {
        const { userId } = req.auth;
        const { name, bio, experienceLevel, interests, preferences } = req.body;
        const user = await (0, user_service_1.updateUserProfile)(userId, {
            name,
            bio,
            experienceLevel,
            interests,
            preferences
        });
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
        console.error("[User Controller] Error updating profile:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to update profile"
        });
    }
}
// ==================== SAVED TOOLS ENDPOINTS ====================
/**
 * GET /auth/me/saved-tools - Get user's saved tools
 */
async function getSavedToolsHandler(req, res) {
    try {
        const { userId } = req.auth;
        const savedTools = await (0, user_service_1.getSavedTools)(userId);
        return res.json({
            success: true,
            data: savedTools
        });
    }
    catch (error) {
        console.error("[User Controller] Error fetching saved tools:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to fetch saved tools"
        });
    }
}
/**
 * POST /auth/me/saved-tools/:toolId - Save a tool
 */
async function saveToolHandler(req, res) {
    try {
        const { userId } = req.auth;
        const { toolId } = req.params;
        const { notes } = req.body;
        const user = await (0, user_service_1.saveTool)(userId, toolId, notes);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: "User not found"
            });
        }
        return res.status(201).json({
            success: true,
            message: "Tool saved successfully"
        });
    }
    catch (error) {
        console.error("[User Controller] Error saving tool:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to save tool"
        });
    }
}
/**
 * DELETE /auth/me/saved-tools/:toolId - Unsave a tool
 */
async function unsaveToolHandler(req, res) {
    try {
        const { userId } = req.auth;
        const { toolId } = req.params;
        await (0, user_service_1.unsaveTool)(userId, toolId);
        return res.json({
            success: true,
            message: "Tool removed from saved"
        });
    }
    catch (error) {
        console.error("[User Controller] Error unsaving tool:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to unsave tool"
        });
    }
}
// ==================== AI STACK ENDPOINTS ====================
/**
 * GET /auth/me/ai-stack - Get user's AI stack
 */
async function getAiStackHandler(req, res) {
    try {
        const { userId } = req.auth;
        const aiStack = await (0, user_service_1.getAiStack)(userId);
        return res.json({
            success: true,
            data: aiStack
        });
    }
    catch (error) {
        console.error("[User Controller] Error fetching AI stack:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to fetch AI stack"
        });
    }
}
/**
 * POST /auth/me/ai-stack - Add tool to AI stack
 */
async function addToAiStackHandler(req, res) {
    try {
        const { userId } = req.auth;
        const { toolId, category, notes } = req.body;
        if (!toolId || !category) {
            return res.status(400).json({
                success: false,
                error: "toolId and category are required"
            });
        }
        const user = await (0, user_service_1.addToAiStack)(userId, toolId, category, notes);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: "User not found"
            });
        }
        return res.status(201).json({
            success: true,
            message: "Tool added to AI stack"
        });
    }
    catch (error) {
        console.error("[User Controller] Error adding to AI stack:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to add to AI stack"
        });
    }
}
/**
 * DELETE /auth/me/ai-stack/:toolId - Remove from AI stack
 */
async function removeFromAiStackHandler(req, res) {
    try {
        const { userId } = req.auth;
        const { toolId } = req.params;
        await (0, user_service_1.removeFromAiStack)(userId, toolId);
        return res.json({
            success: true,
            message: "Tool removed from AI stack"
        });
    }
    catch (error) {
        console.error("[User Controller] Error removing from AI stack:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to remove from AI stack"
        });
    }
}
// ==================== ACCOUNT DELETION ====================
/**
 * DELETE /auth/me - Delete current user account
 * This removes user data from MongoDB.
 * Frontend should call Clerk's user.delete() after this succeeds.
 */
async function deleteMe(req, res) {
    try {
        const { userId } = req.auth;
        // Delete user from MongoDB
        const { deleteUser } = await Promise.resolve().then(() => __importStar(require("../services/user.service")));
        const result = await deleteUser(userId);
        if (!result) {
            return res.status(404).json({
                success: false,
                error: "User not found"
            });
        }
        return res.json({
            success: true,
            message: "Account deleted successfully"
        });
    }
    catch (error) {
        console.error("[User Controller] Error deleting account:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to delete account"
        });
    }
}
