"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
// services/auth-service/src/models/User.ts
const mongoose_1 = require("mongoose");
const UserSchema = new mongoose_1.Schema({
    clerkUserId: { type: String, required: true, unique: true },
    email: { type: String },
    name: { type: String },
    image: { type: String },
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user",
    },
    // Extended profile fields
    profile: {
        bio: { type: String, maxlength: 500 },
        experienceLevel: {
            type: String,
            enum: ["beginner", "intermediate", "advanced"],
        },
        interests: [{ type: String }],
    },
    // Saved tools for quick access
    savedTools: [{
            toolId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Tool" },
            savedAt: { type: Date, default: Date.now },
            notes: { type: String, maxlength: 500 },
        }],
    // Personal AI Stack - curated tools collection
    aiStack: [{
            toolId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Tool" },
            category: { type: String, required: true },
            notes: { type: String, maxlength: 500 },
            addedAt: { type: Date, default: Date.now },
        }],
    // User preferences
    preferences: {
        emailNotifications: { type: Boolean, default: true },
        theme: {
            type: String,
            enum: ["light", "dark", "system"],
            default: "system",
        },
    },
}, { timestamps: true });
// Indexes for efficient queries
UserSchema.index({ "savedTools.toolId": 1 });
UserSchema.index({ "aiStack.toolId": 1 });
exports.User = (0, mongoose_1.model)("User", UserSchema);
