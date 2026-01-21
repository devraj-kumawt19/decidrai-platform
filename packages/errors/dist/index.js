"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GatewayTimeoutError = exports.ServiceUnavailableError = exports.InternalError = exports.RateLimitError = exports.ValidationError = exports.ConflictError = exports.NotFoundError = exports.ForbiddenError = exports.UnauthorizedError = exports.BadRequestError = exports.AppError = void 0;
/**
 * Base application error
 */
class AppError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.isOperational = true;
    }
}
exports.AppError = AppError;
/**
 * 400 Bad Request
 */
class BadRequestError extends AppError {
    constructor(message = 'Bad request') {
        super(message, 400);
    }
}
exports.BadRequestError = BadRequestError;
/**
 * 401 Unauthorized
 */
class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized') {
        super(message, 401);
    }
}
exports.UnauthorizedError = UnauthorizedError;
/**
 * 403 Forbidden
 */
class ForbiddenError extends AppError {
    constructor(message = 'Forbidden') {
        super(message, 403);
    }
}
exports.ForbiddenError = ForbiddenError;
/**
 * 404 Not Found
 */
class NotFoundError extends AppError {
    constructor(message = 'Not found') {
        super(message, 404);
    }
}
exports.NotFoundError = NotFoundError;
/**
 * 409 Conflict
 */
class ConflictError extends AppError {
    constructor(message = 'Conflict') {
        super(message, 409);
    }
}
exports.ConflictError = ConflictError;
/**
 * 422 Validation Error
 */
class ValidationError extends AppError {
    constructor(message = 'Validation failed', errors = {}) {
        super(message, 422);
        this.errors = errors;
    }
}
exports.ValidationError = ValidationError;
/**
 * 429 Rate Limit Error
 */
class RateLimitError extends AppError {
    constructor(message = 'Too many requests', retryAfter = 60) {
        super(message, 429);
        this.retryAfter = retryAfter;
    }
}
exports.RateLimitError = RateLimitError;
/**
 * 500 Internal Server Error
 */
class InternalError extends AppError {
    constructor(message = 'Internal server error') {
        super(message, 500);
    }
}
exports.InternalError = InternalError;
/**
 * 503 Service Unavailable
 */
class ServiceUnavailableError extends AppError {
    constructor(message = 'Service unavailable') {
        super(message, 503);
    }
}
exports.ServiceUnavailableError = ServiceUnavailableError;
/**
 * 504 Gateway Timeout
 */
class GatewayTimeoutError extends AppError {
    constructor(message = 'Gateway timeout') {
        super(message, 504);
    }
}
exports.GatewayTimeoutError = GatewayTimeoutError;
