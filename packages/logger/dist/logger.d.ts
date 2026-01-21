export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
/**
 * Create a logger instance for a service
 */
export declare function createLogger(serviceName: string, minLevel?: LogLevel): {
    debug: (message: string, meta?: Record<string, unknown>) => void;
    info: (message: string, meta?: Record<string, unknown>) => void;
    warn: (message: string, meta?: Record<string, unknown>) => void;
    error: (message: string, meta?: Record<string, unknown>) => void;
    request: (method: string, path: string, statusCode: number, durationMs: number) => void;
};
export type Logger = ReturnType<typeof createLogger>;
//# sourceMappingURL=logger.d.ts.map