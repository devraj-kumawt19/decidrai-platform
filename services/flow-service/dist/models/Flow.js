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
exports.Flow = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// Question Option Schema
const QuestionOptionSchema = new mongoose_1.Schema({
    label: {
        type: String,
        required: true,
        trim: true
    },
    value: {
        type: String,
        required: true,
        trim: true
    },
    tags: {
        type: [String],
        default: []
    }
}, { _id: false });
// Question Schema
const FlowQuestionSchema = new mongoose_1.Schema({
    id: {
        type: String,
        required: true
    },
    text: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['single', 'multiple', 'range', 'text'],
        default: 'single'
    },
    options: {
        type: [QuestionOptionSchema],
        default: []
    },
    required: {
        type: Boolean,
        default: true
    },
    nextQuestionLogic: {
        conditions: [{
                answerValue: mongoose_1.Schema.Types.Mixed,
                skipToQuestionId: String,
                endFlow: Boolean
            }]
    }
}, { _id: false });
// Flow Schema
const FlowSchema = new mongoose_1.Schema({
    // Basic Info
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    slug: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
    },
    icon: {
        type: String,
        trim: true
    },
    // Flow Structure
    questions: {
        type: [FlowQuestionSchema],
        default: []
    },
    // Matching Configuration
    requiredTags: {
        type: [String],
        default: []
    },
    optionalTags: {
        type: [String],
        default: []
    },
    scoringWeights: {
        price: {
            type: Number,
            default: 1,
            min: 0,
            max: 10
        },
        learningCurve: {
            type: Number,
            default: 1,
            min: 0,
            max: 10
        },
        features: {
            type: Number,
            default: 1,
            min: 0,
            max: 10
        }
    },
    // Metadata
    category: {
        type: String,
        trim: true,
        default: 'general'
    },
    popularity: {
        type: Number,
        default: 0,
        min: 0
    },
    completionRate: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    avgTimeSeconds: {
        type: Number,
        default: 0,
        min: 0
    },
    // Admin
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'draft'
    }
}, {
    timestamps: true
});
// Indexes
FlowSchema.index({ slug: 1 }, { unique: true });
FlowSchema.index({ title: 'text', description: 'text' });
FlowSchema.index({ category: 1 });
FlowSchema.index({ status: 1 });
FlowSchema.index({ popularity: -1 });
FlowSchema.index({ createdAt: -1 });
// Generate slug from title
const slugify_1 = require("../utils/slugify");
FlowSchema.pre('validate', function () {
    if (this.title && !this.slug) {
        this.slug = (0, slugify_1.slugify)(this.title);
    }
});
// Export model
exports.Flow = mongoose_1.default.model('Flow', FlowSchema);
