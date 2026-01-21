/**
 * Base application error
 */
export declare class AppError extends Error {
    statusCode: number;
    isOperational: boolean;
    constructor(message: string, statusCode?: number);
}
/**
 * 400 Bad Request
 */
export declare class BadRequestError extends AppError {
    constructor(message?: string);
}
/**
 * 401 Unauthorized
 */
export declare class UnauthorizedError extends AppError {
    constructor(message?: string);
}
/**
 * 403 Forbidden
 */
export declare class ForbiddenError extends AppError {
    constructor(message?: string);
}
/**
 * 404 Not Found
 */
export declare class NotFoundError extends AppError {
    constructor(message?: string);
}
/**
 * 409 Conflict
 */
export declare class ConflictError extends AppError {
    constructor(message?: string);
}
/**
 * 422 Validation Error
 */
export declare class ValidationError extends AppError {
    errors: Record<string, string[]>;
    constructor(message?: string, errors?: Record<string, string[]>);
}
/**
 * 429 Rate Limit Error
 */
export declare class RateLimitError extends AppError {
    retryAfter: number;
    constructor(message?: string, retryAfter?: number);
}
/**
 * 500 Internal Server Error
 */
export declare class InternalError extends AppError {
    constructor(message?: string);
}
/**
 * 503 Service Unavailable
 */
export declare class ServiceUnavailableError extends AppError {
    constructor(message?: string);
}
/**
 * 504 Gateway Timeout
 */
export declare class GatewayTimeoutError extends AppError {
    constructor(message?: string);
}
//# sourceMappingURL=index.d.ts.map