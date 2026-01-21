"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchToolsBySlugs = fetchToolsBySlugs;
exports.generateComparison = generateComparison;
const generative_ai_1 = require("@google/generative-ai");
const axios_1 = __importDefault(require("axios"));
const TOOL_SERVICE_URL = process.env.TOOL_SERVICE_URL || 'http://localhost:5003';
// Initialize Gemini
const genAI = process.env.GEMINI_API_KEY
    ? new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    : null;
/**
 * Fetch tools from tool-service by slugs
 */
async function fetchToolsBySlugs(slugs) {
    const tools = [];
    for (const slug of slugs) {
        try {
            const response = await axios_1.default.get(`${TOOL_SERVICE_URL}/tools/${slug}`, {
                timeout: 5000
            });
            if (response.data?.success && response.data?.data) {
                tools.push(response.data.data);
            }
        }
        catch (error) {
            console.error(`[ComparisonGenerator] Failed to fetch tool: ${slug}`, error);
        }
    }
    return tools;
}
/**
 * Generate template-based comparison (fallback)
 */
function generateTemplateComparison(tools) {
    const toolNames = tools.map(t => t.name).join(' vs ');
    const summary = `Comparing ${toolNames}: Both are popular tools in their categories. ${tools[0].name} is ${tools[0].pricing.model} with a ${tools[0].learning_curve} learning curve, while ${tools[1]?.name || 'the alternative'} offers ${tools[1]?.pricing.model || 'different'} pricing.`;
    const winnerScenarios = tools.map(tool => ({
        toolSlug: tool.slug,
        scenario: `Best for ${tool.best_for?.[0] || tool.categories[0] || 'general use'}`,
        reasoning: tool.tagline || tool.description.slice(0, 100)
    }));
    const features = [
        'Pricing',
        'Learning Curve',
        'API Access',
        'Platforms'
    ];
    const featureComparison = features.map(feature => {
        const toolValues = {};
        for (const tool of tools) {
            switch (feature) {
                case 'Pricing':
                    toolValues[tool.slug] = tool.pricing.model +
                        (tool.pricing.starting_price ? ` ($${tool.pricing.starting_price}/mo)` : '');
                    break;
                case 'Learning Curve':
                    toolValues[tool.slug] = tool.learning_curve;
                    break;
                case 'API Access':
                    toolValues[tool.slug] = tool.has_api ? 'Yes' : 'No';
                    break;
                case 'Platforms':
                    toolValues[tool.slug] = tool.platforms?.join(', ') || 'Web';
                    break;
            }
        }
        return { feature, toolValues };
    });
    return { summary, winnerScenarios, featureComparison };
}
/**
 * Generate AI-powered comparison using Gemini
 */
async function generateComparison(tools) {
    if (!genAI || tools.length < 2) {
        console.log('[ComparisonGenerator] Using template (no Gemini or insufficient tools)');
        return generateTemplateComparison(tools);
    }
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const toolsInfo = tools.map(t => `
**${t.name}** (${t.slug})
- Description: ${t.description}
- Categories: ${t.categories.join(', ')}
- Pricing: ${t.pricing.model}${t.pricing.starting_price ? ` ($${t.pricing.starting_price}/mo)` : ''}
- Learning Curve: ${t.learning_curve}
- Best For: ${t.best_for?.join(', ') || 'General use'}
- Not Good For: ${t.not_good_for?.join(', ') || 'N/A'}
- Has API: ${t.has_api ? 'Yes' : 'No'}
- Platforms: ${t.platforms?.join(', ') || 'Web'}
`).join('\n');
        const prompt = `You are an AI tool comparison expert. Compare these AI tools objectively and helpfully.

TOOLS TO COMPARE:
${toolsInfo}

Generate a JSON response with exactly this structure:
{
  "summary": "2-3 sentences comparing the tools objectively, noting key differences and similarities",
  "winnerScenarios": [
    {
      "toolSlug": "slug-of-tool",
      "scenario": "When this tool is the best choice (one specific use case)",
      "reasoning": "1 sentence explaining why"
    }
  ],
  "featureComparison": [
    {
      "feature": "Feature name",
      "description": "Brief description of why this matters",
      "toolValues": {
        "tool-slug-1": "Value for tool 1",
        "tool-slug-2": "Value for tool 2"
      }
    }
  ]
}

Include 2-4 winner scenarios (one per tool where that tool excels).
Include 5-8 feature comparisons covering: Pricing, Learning Curve, API, Integrations, Best Use Case, Main Weakness, Target User.

Be objective and helpful. Respond ONLY with valid JSON, no markdown.`;
        const result = await model.generateContent(prompt);
        const response = result.response.text();
        const cleanedResponse = response
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();
        const parsed = JSON.parse(cleanedResponse);
        return {
            summary: parsed.summary || generateTemplateComparison(tools).summary,
            winnerScenarios: parsed.winnerScenarios || [],
            featureComparison: parsed.featureComparison || []
        };
    }
    catch (error) {
        console.error('[ComparisonGenerator] Gemini error, using template:', error);
        return generateTemplateComparison(tools);
    }
}
