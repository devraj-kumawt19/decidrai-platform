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
exports.FlowSession = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// Answer Schema
const SessionAnswerSchema = new mongoose_1.Schema({
    questionId: {
        type: String,
        required: true
    },
    value: {
        type: mongoose_1.Schema.Types.Mixed,
        required: true
    },
    tags: {
        type: [String],
        default: []
    },
    answeredAt: {
        type: Date,
        default: Date.now
    }
}, { _id: false });
// Flow Session Schema
const FlowSessionSchema = new mongoose_1.Schema({
    sessionId: {
        type: String,
        required: true,
        index: true
    },
    flowId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Flow',
        required: true,
        index: true
    },
    userId: {
        type: String,
        index: true
    },
    // Progress
    answers: {
        type: [SessionAnswerSchema],
        default: []
    },
    currentQuestionIndex: {
        type: Number,
        default: 0,
        min: 0
    },
    extractedTags: {
        type: [String],
        default: []
    },
    // Status
    status: {
        type: String,
        enum: ['in_progress', 'completed', 'abandoned'],
        default: 'in_progress'
    },
    startedAt: {
        type: Date,
        default: Date.now
    },
    completedAt: {
        type: Date
    }
}, {
    timestamps: true
});
// Indexes
FlowSessionSchema.index({ sessionId: 1 }, { unique: true });
FlowSessionSchema.index({ flowId: 1, status: 1 });
FlowSessionSchema.index({ userId: 1, status: 1 });
FlowSessionSchema.index({ createdAt: -1 });
// TTL index - sessions expire after 7 days of inactivity
FlowSessionSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });
// Export model
exports.FlowSession = mongoose_1.default.model('FlowSession', FlowSessionSchema);
