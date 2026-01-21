"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchTools = fetchTools;
exports.fetchFlowSession = fetchFlowSession;
exports.matchToolsToTags = matchToolsToTags;
const axios_1 = __importDefault(require("axios"));
// Tool Service configuration
const TOOL_SERVICE_URL = process.env.TOOL_SERVICE_URL || 'http://localhost:5003';
// Flow Service configuration
const FLOW_SERVICE_URL = process.env.FLOW_SERVICE_URL || 'http://localhost:5004';
/**
 * Calculate tag score for a single tool
 */
function calculateToolScore(tool, userTags) {
    const userTagSet = new Set(userTags.map(t => t.toLowerCase()));
    const matchedTags = [];
    let score = 0;
    // Combine all tool tags for matching
    const toolTags = [
        ...tool.categories,
        ...tool.problems_solved,
        ...tool.use_cases,
        ...tool.best_for
    ].map(t => t.toLowerCase());
    // Calculate overlap
    for (const tag of toolTags) {
        if (userTagSet.has(tag)) {
            matchedTags.push(tag);
            score += 10; // Base score per matched tag
        }
    }
    // Check for partial matches (substring matching)
    for (const userTag of userTags) {
        const lowerUserTag = userTag.toLowerCase();
        for (const toolTag of toolTags) {
            if (toolTag.includes(lowerUserTag) || lowerUserTag.includes(toolTag)) {
                if (!matchedTags.includes(toolTag)) {
                    matchedTags.push(toolTag);
                    score += 5; // Partial match score
                }
            }
        }
    }
    // Apply pricing preference bonus
    if (userTagSet.has('free') && tool.pricing.model === 'free') {
        score += 15;
    }
    else if (userTagSet.has('freemium') && tool.pricing.model === 'freemium') {
        score += 10;
    }
    // Apply learning curve preference bonus
    if (userTagSet.has('beginner') && tool.learning_curve === 'low') {
        score += 15;
    }
    else if (userTagSet.has('advanced') && tool.learning_curve === 'high') {
        score += 10;
    }
    // API availability bonus
    if ((userTagSet.has('api') || userTagSet.has('developer')) && tool.has_api) {
        score += 15;
    }
    // Normalize score to 0-100 range
    score = Math.min(100, score);
    return { score, matchedTags };
}
/**
 * Fetch all published tools from tool-service
 */
async function fetchTools() {
    try {
        const response = await axios_1.default.get(`${TOOL_SERVICE_URL}/tools`, {
            params: { limit: 100, status: 'published' },
            timeout: 5000
        });
        if (response.data?.success && response.data?.data?.tools) {
            return response.data.data.tools;
        }
        return [];
    }
    catch (error) {
        console.error('[TagMatcher] Error fetching tools:', error);
        return [];
    }
}
/**
 * Fetch flow session from flow-service
 */
async function fetchFlowSession(sessionId) {
    try {
        const response = await axios_1.default.get(`${FLOW_SERVICE_URL}/flows/sessions/${sessionId}`, {
            timeout: 5000
        });
        if (response.data?.success && response.data?.data) {
            return {
                extractedTags: response.data.data.extractedTags || []
            };
        }
        return null;
    }
    catch (error) {
        console.error('[TagMatcher] Error fetching flow session:', error);
        return null;
    }
}
/**
 * Match tools against user tags and return scored results
 */
function matchToolsToTags(tools, userTags) {
    if (!userTags || userTags.length === 0) {
        return [];
    }
    const scoredTools = [];
    for (const tool of tools) {
        const { score, matchedTags } = calculateToolScore(tool, userTags);
        // Only include tools with some match
        if (score > 0) {
            scoredTools.push({
                tool,
                score,
                matchedTags
            });
        }
    }
    return scoredTools;
}
