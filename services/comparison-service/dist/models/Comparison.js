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
exports.Comparison = void 0;
const mongoose_1 = __importStar(require("mongoose"));
/**
 * Winner scenario schema
 */
const WinnerScenarioSchema = new mongoose_1.Schema({
    toolId: { type: mongoose_1.Schema.Types.ObjectId, required: true },
    toolSlug: { type: String, required: true },
    scenario: { type: String, required: true },
    reasoning: { type: String, required: true }
}, { _id: false });
/**
 * Feature comparison schema
 */
const FeatureComparisonSchema = new mongoose_1.Schema({
    feature: { type: String, required: true },
    description: { type: String },
    toolValues: { type: Map, of: String, required: true }
}, { _id: false });
/**
 * Comparison schema
 */
const ComparisonSchema = new mongoose_1.Schema({
    toolIds: {
        type: [mongoose_1.Schema.Types.ObjectId],
        required: true,
        validate: {
            validator: (v) => v.length >= 2 && v.length <= 4,
            message: 'Comparison requires 2-4 tools'
        }
    },
    toolSlugs: {
        type: [String],
        required: true,
        validate: {
            validator: (v) => v.length >= 2 && v.length <= 4,
            message: 'Comparison requires 2-4 tool slugs'
        }
    },
    summary: { type: String, required: true },
    winnerScenarios: { type: [WinnerScenarioSchema], default: [] },
    featureComparison: { type: [FeatureComparisonSchema], default: [] },
    generatedAt: { type: Date, default: Date.now },
    cacheUntil: {
        type: Date,
        default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    },
    generationModel: { type: String, default: 'gemini-1.5-flash' },
    viewCount: { type: Number, default: 0 }
}, {
    timestamps: true
});
// Index for quick lookup by tools
ComparisonSchema.index({ toolSlugs: 1 });
ComparisonSchema.index({ toolIds: 1 });
exports.Comparison = mongoose_1.default.model('Comparison', ComparisonSchema);
