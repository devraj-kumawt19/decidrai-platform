"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rankByScore = rankByScore;
exports.applyDiversityPenalty = applyDiversityPenalty;
exports.getTopN = getTopN;
exports.applySponsoredBoost = applySponsoredBoost;
exports.rankTools = rankTools;
/**
 * Sort tools by score in descending order
 */
function rankByScore(tools) {
    return [...tools].sort((a, b) => b.score - a.score);
}
/**
 * Apply diversity penalty to avoid same-category clustering
 * Reduces score of tools that share categories with higher-ranked tools
 */
function applyDiversityPenalty(tools, penaltyPercent = 10) {
    if (tools.length <= 1)
        return tools;
    const result = [];
    const seenCategories = new Set();
    for (const tool of tools) {
        let adjustedScore = tool.score;
        // Check for category overlap with already selected tools
        const toolCategories = tool.tool.categories || [];
        const overlappingCategories = toolCategories.filter(cat => seenCategories.has(cat.toLowerCase()));
        if (overlappingCategories.length > 0) {
            // Apply penalty for each overlapping category
            const penalty = (overlappingCategories.length / toolCategories.length) * penaltyPercent;
            adjustedScore = Math.max(0, adjustedScore - penalty);
        }
        // Add categories to seen set
        toolCategories.forEach(cat => seenCategories.add(cat.toLowerCase()));
        result.push({
            ...tool,
            score: adjustedScore
        });
    }
    // Re-sort after applying penalties
    return result.sort((a, b) => b.score - a.score);
}
/**
 * Get top N recommendations
 */
function getTopN(tools, n = 3) {
    return tools.slice(0, n);
}
/**
 * Apply sponsored boost (slight preference for sponsored tools at similar scores)
 */
function applySponsoredBoost(tools, boostPercent = 5) {
    return tools.map(item => {
        if (item.tool.is_sponsored) {
            return {
                ...item,
                score: Math.min(100, item.score + boostPercent)
            };
        }
        return item;
    });
}
/**
 * Full ranking pipeline
 */
function rankTools(tools, options = {}) {
    const { applyDiversity = true, applySponsoredBoost: sponsoredBoost = true, topN = 3 } = options;
    let ranked = rankByScore(tools);
    if (sponsoredBoost) {
        ranked = applySponsoredBoost(ranked);
        ranked = rankByScore(ranked); // Re-sort after boost
    }
    if (applyDiversity) {
        ranked = applyDiversityPenalty(ranked);
    }
    return getTopN(ranked, topN);
}
