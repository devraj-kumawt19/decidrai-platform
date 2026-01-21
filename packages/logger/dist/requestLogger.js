"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRequestLogger = createRequestLogger;
const logger_1 = require("./logger");
/**
 * Create Express request logger middleware
 */
function createRequestLogger(serviceName) {
    const logger = (0, logger_1.createLogger)(serviceName);
    return (req, res, next) => {
        const startTime = Date.now();
        res.on('finish', () => {
            const duration = Date.now() - startTime;
            logger.request(req.method, req.originalUrl, res.statusCode, duration);
        });
        next();
    };
}
