"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Interaction = void 0;
// services/auth-service/src/models/Interaction.ts
const mongoose_1 = require("mongoose");
const InteractionSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", index: true },
    sessionId: { type: String, required: true, index: true },
    eventType: {
        type: String,
        enum: ["view", "click", "save", "compare", "flow_start", "flow_complete"],
        required: true,
    },
    toolId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Tool", index: true },
    flowId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Flow" },
    source: { type: String }, // "search", "flow", "homepage", "comparison"
    metadata: { type: mongoose_1.Schema.Types.Mixed },
    userAgent: { type: String },
    ipAddress: { type: String },
}, { timestamps: true });
// Compound indexes for analytics queries
InteractionSchema.index({ toolId: 1, eventType: 1, createdAt: -1 });
InteractionSchema.index({ userId: 1, eventType: 1, createdAt: -1 });
exports.Interaction = (0, mongoose_1.model)("Interaction", InteractionSchema);
