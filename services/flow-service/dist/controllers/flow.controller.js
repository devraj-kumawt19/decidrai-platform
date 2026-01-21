"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFlow = exports.updateFlow = exports.createFlow = exports.completeFlow = exports.getSession = exports.submitAnswer = exports.startFlow = exports.getFlowBySlug = exports.getAllFlows = void 0;
const uuid_1 = require("uuid");
const Flow_1 = require("../models/Flow");
const FlowSession_1 = require("../models/FlowSession");
const cache_service_1 = require("../services/cache.service");
const flow_service_1 = require("../services/flow.service");
const questionEngine_1 = require("../engine/questionEngine");
// ==================== PUBLIC CONTROLLERS ====================
/**
 * Get all flows with pagination and filters
 * GET /flows?page=1&limit=12&category=interview
 */
const getAllFlows = async (req, res) => {
    try {
        const { page = 1, limit = 12, category, sort = 'popular' } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        // Build filter query
        const filter = { status: 'published' };
        if (category) {
            filter.category = category;
        }
        // Check cache
        const cacheKey = cache_service_1.CacheService.getFlowsListKey({ page, limit, category, sort });
        const cached = await cache_service_1.CacheService.get(cacheKey);
        if (cached) {
            res.json(cached);
            return;
        }
        // Build sort query
        let sortQuery = {};
        switch (sort) {
            case 'popular':
                sortQuery = { popularity: -1 };
                break;
            case 'completion':
                sortQuery = { completionRate: -1 };
                break;
            default:
                sortQuery = { createdAt: -1 };
        }
        // Execute query
        const [flows, total] = await Promise.all([
            Flow_1.Flow.find(filter)
                .sort(sortQuery)
                .limit(limitNum)
                .skip(skip)
                .select('title slug description icon category popularity completionRate avgTimeSeconds')
                .lean(),
            Flow_1.Flow.countDocuments(filter)
        ]);
        // Calculate estimated time for each flow
        const flowsWithMeta = flows.map(flow => ({
            ...flow,
            estimatedTimeMinutes: Math.ceil((flow.avgTimeSeconds || 180) / 60)
        }));
        const response = {
            success: true,
            data: {
                flows: flowsWithMeta,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    pages: Math.ceil(total / limitNum)
                }
            }
        };
        // Cache response
        await cache_service_1.CacheService.set(cacheKey, response, cache_service_1.CACHE_TTL.FLOWS_LIST);
        res.json(response);
    }
    catch (error) {
        console.error('[getAllFlows] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch flows',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getAllFlows = getAllFlows;
/**
 * Get flow by slug
 * GET /flows/:slug
 */
const getFlowBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        // Check cache
        const cacheKey = cache_service_1.CacheService.getFlowKey(slug);
        const cached = await cache_service_1.CacheService.get(cacheKey);
        if (cached) {
            const engine = new questionEngine_1.QuestionEngine(cached);
            res.json({
                success: true,
                data: {
                    ...engine.getFlowSummary(),
                    questions: cached.questions.map((_, i) => engine.getQuestionByIndex(i))
                }
            });
            return;
        }
        // Increment popularity
        const flow = await Flow_1.Flow.findOneAndUpdate({ slug, status: 'published' }, { $inc: { popularity: 1 } }, { new: true }).lean();
        if (!flow) {
            res.status(404).json({
                success: false,
                message: 'Flow not found'
            });
            return;
        }
        // Cache the flow
        await cache_service_1.CacheService.set(cacheKey, flow, cache_service_1.CACHE_TTL.FLOW_DETAIL);
        const engine = new questionEngine_1.QuestionEngine(flow);
        res.json({
            success: true,
            data: {
                ...engine.getFlowSummary(),
                questions: flow.questions.map((_, i) => engine.getQuestionByIndex(i))
            }
        });
    }
    catch (error) {
        console.error('[getFlowBySlug] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch flow',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getFlowBySlug = getFlowBySlug;
/**
 * Start a new flow session
 * POST /flows/:slug/start
 */
const startFlow = async (req, res) => {
    try {
        const { slug } = req.params;
        const { userId } = req.body; // Optional
        const flow = await Flow_1.Flow.findOne({ slug, status: 'published' }).lean();
        if (!flow) {
            res.status(404).json({
                success: false,
                message: 'Flow not found'
            });
            return;
        }
        // Create a new session
        const sessionId = (0, uuid_1.v4)();
        const session = new FlowSession_1.FlowSession({
            sessionId,
            flowId: flow._id,
            userId,
            answers: [],
            currentQuestionIndex: 0,
            extractedTags: [],
            status: 'in_progress',
            startedAt: new Date()
        });
        await session.save();
        // Get first question
        const engine = new questionEngine_1.QuestionEngine(flow);
        const firstQuestion = engine.getQuestionByIndex(0);
        res.status(201).json({
            success: true,
            data: {
                sessionId,
                flow: engine.getFlowSummary(),
                currentQuestion: firstQuestion,
                progress: 0
            }
        });
    }
    catch (error) {
        console.error('[startFlow] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to start flow',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.startFlow = startFlow;
/**
 * Submit an answer for a flow session
 * POST /flows/sessions/:sessionId/answer
 */
const submitAnswer = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { questionId, value } = req.body;
        if (!questionId || value === undefined) {
            res.status(400).json({
                success: false,
                message: 'questionId and value are required'
            });
            return;
        }
        // Find session and populate flow
        const session = await FlowSession_1.FlowSession.findOne({ sessionId, status: 'in_progress' });
        if (!session) {
            res.status(404).json({
                success: false,
                message: 'Session not found or already completed'
            });
            return;
        }
        const flow = await Flow_1.Flow.findById(session.flowId).lean();
        if (!flow) {
            res.status(404).json({
                success: false,
                message: 'Flow not found'
            });
            return;
        }
        const engine = new questionEngine_1.QuestionEngine(flow);
        // Validate the answer
        const validation = engine.validateAnswer(questionId, value);
        if (!validation.valid) {
            res.status(400).json({
                success: false,
                message: validation.error
            });
            return;
        }
        // Extract tags from this answer
        const answerTags = flow_service_1.FlowService.extractTagsFromAnswer(flow, questionId, value);
        // Add answer to session
        session.answers.push({
            questionId,
            value,
            tags: answerTags,
            answeredAt: new Date()
        });
        // Update extracted tags
        session.extractedTags = flow_service_1.FlowService.aggregateTags(session);
        // Determine next question
        const nextResult = engine.getNextQuestion(session.currentQuestionIndex, value);
        if (nextResult) {
            session.currentQuestionIndex = nextResult.index;
        }
        else {
            // Flow is complete
            session.status = 'completed';
            session.completedAt = new Date();
        }
        await session.save();
        // Calculate progress
        const progress = flow_service_1.FlowService.calculateProgress(flow, session.answers.length);
        if (session.status === 'completed') {
            res.json({
                success: true,
                data: {
                    sessionId,
                    status: 'completed',
                    extractedTags: session.extractedTags,
                    progress: 100,
                    message: 'Flow completed successfully'
                }
            });
        }
        else {
            res.json({
                success: true,
                data: {
                    sessionId,
                    currentQuestion: nextResult?.question,
                    extractedTags: session.extractedTags,
                    progress
                }
            });
        }
    }
    catch (error) {
        console.error('[submitAnswer] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit answer',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.submitAnswer = submitAnswer;
/**
 * Get session details (for resuming)
 * GET /flows/sessions/:sessionId
 */
const getSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const session = await FlowSession_1.FlowSession.findOne({ sessionId });
        if (!session) {
            res.status(404).json({
                success: false,
                message: 'Session not found'
            });
            return;
        }
        const flow = await Flow_1.Flow.findById(session.flowId).lean();
        if (!flow) {
            res.status(404).json({
                success: false,
                message: 'Flow not found'
            });
            return;
        }
        const engine = new questionEngine_1.QuestionEngine(flow);
        const progress = flow_service_1.FlowService.calculateProgress(flow, session.answers.length);
        const responseData = {
            sessionId: session.sessionId,
            flow: engine.getFlowSummary(),
            status: session.status,
            progress,
            answeredQuestions: session.answers.length,
            extractedTags: session.extractedTags
        };
        // If in progress, include current question
        if (session.status === 'in_progress') {
            responseData.currentQuestion = engine.getQuestionByIndex(session.currentQuestionIndex);
        }
        res.json({
            success: true,
            data: responseData
        });
    }
    catch (error) {
        console.error('[getSession] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch session',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getSession = getSession;
/**
 * Complete a flow session manually
 * POST /flows/sessions/:sessionId/complete
 */
const completeFlow = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const session = await FlowSession_1.FlowSession.findOne({ sessionId });
        if (!session) {
            res.status(404).json({
                success: false,
                message: 'Session not found'
            });
            return;
        }
        if (session.status === 'completed') {
            res.json({
                success: true,
                data: {
                    sessionId: session.sessionId,
                    status: 'completed',
                    extractedTags: session.extractedTags,
                    message: 'Session was already completed'
                }
            });
            return;
        }
        // Update flow completion stats
        const flow = await Flow_1.Flow.findById(session.flowId);
        if (flow) {
            // Update completion rate (simple moving average)
            const completedSessions = await FlowSession_1.FlowSession.countDocuments({
                flowId: flow._id,
                status: 'completed'
            });
            const totalSessions = await FlowSession_1.FlowSession.countDocuments({
                flowId: flow._id,
                status: { $ne: 'in_progress' }
            });
            flow.completionRate = totalSessions > 0
                ? Math.round((completedSessions / totalSessions) * 100)
                : 0;
            // Calculate average time
            const startTime = session.startedAt.getTime();
            const endTime = Date.now();
            const durationSeconds = Math.round((endTime - startTime) / 1000);
            // Simple moving average for avg time
            flow.avgTimeSeconds = flow.avgTimeSeconds > 0
                ? Math.round((flow.avgTimeSeconds + durationSeconds) / 2)
                : durationSeconds;
            await flow.save();
        }
        // Mark session as complete
        session.status = 'completed';
        session.completedAt = new Date();
        await session.save();
        res.json({
            success: true,
            data: {
                sessionId: session.sessionId,
                status: 'completed',
                extractedTags: session.extractedTags,
                message: 'Flow completed successfully'
            }
        });
    }
    catch (error) {
        console.error('[completeFlow] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to complete flow',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.completeFlow = completeFlow;
// ==================== ADMIN CONTROLLERS ====================
/**
 * Create new flow
 * POST /admin/flows
 */
const createFlow = async (req, res) => {
    try {
        const flowData = req.body;
        const flow = new Flow_1.Flow(flowData);
        await flow.save();
        // Clear cache
        await cache_service_1.CacheService.delPattern('flows:*');
        res.status(201).json({
            success: true,
            data: flow,
            message: 'Flow created successfully'
        });
    }
    catch (error) {
        console.error('[createFlow] Error:', error);
        if (error.code === 11000) {
            res.status(400).json({
                success: false,
                message: 'Flow with this slug already exists'
            });
            return;
        }
        res.status(500).json({
            success: false,
            message: 'Failed to create flow',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.createFlow = createFlow;
/**
 * Update flow
 * PATCH /admin/flows/:id
 */
const updateFlow = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const flow = await Flow_1.Flow.findByIdAndUpdate(id, { $set: updates }, { new: true, runValidators: true });
        if (!flow) {
            res.status(404).json({
                success: false,
                message: 'Flow not found'
            });
            return;
        }
        // Clear cache
        await cache_service_1.CacheService.delPattern('flows:*');
        await cache_service_1.CacheService.del(cache_service_1.CacheService.getFlowKey(flow.slug));
        res.json({
            success: true,
            data: flow,
            message: 'Flow updated successfully'
        });
    }
    catch (error) {
        console.error('[updateFlow] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update flow',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.updateFlow = updateFlow;
/**
 * Delete flow (soft delete)
 * DELETE /admin/flows/:id
 */
const deleteFlow = async (req, res) => {
    try {
        const { id } = req.params;
        const flow = await Flow_1.Flow.findByIdAndUpdate(id, { $set: { status: 'archived' } }, { new: true });
        if (!flow) {
            res.status(404).json({
                success: false,
                message: 'Flow not found'
            });
            return;
        }
        // Clear cache
        await cache_service_1.CacheService.delPattern('flows:*');
        await cache_service_1.CacheService.del(cache_service_1.CacheService.getFlowKey(flow.slug));
        res.json({
            success: true,
            message: 'Flow archived successfully'
        });
    }
    catch (error) {
        console.error('[deleteFlow] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete flow',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.deleteFlow = deleteFlow;
