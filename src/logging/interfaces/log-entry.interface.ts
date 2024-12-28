/**
 * Represents a structured log entry in the system.
 * Ensures consistent log format across all components.
 */
export interface LogEntry {
    // Timestamp when the log was created
    timestamp: string;

    // Log level (debug, info, warn, error)
    level: string;

    // Main log message
    message: string;

    // Request correlation ID for tracing
    correlationId?: string;

    // Service or component that generated the log
    service?: string;

    // Error details if this is an error log
    error?: {
        name: string;
        message: string;
        stack?: string;
        code?: string;
        details?: Record<string, any>;
    };

    // HTTP request details if this is a request log
    request?: {
        method: string;
        url: string;
        headers: Record<string, string>;
        body?: any;
        params?: Record<string, string>;
        query?: Record<string, string>;
    };

    // HTTP response details if this is a response log
    response?: {
        statusCode: number;
        headers: Record<string, string>;
        body?: any;
        timing?: number;
    };

    // User context if available
    user?: {
        id: string;
        email?: string;
        roles?: string[];
    };

    // Additional structured data
    metadata?: Record<string, any>;

    // Host and process information
    context?: {
        hostname: string;
        pid: number;
        memory?: {
            heapUsed: number;
            heapTotal: number;
        };
    };
}

/**
 * Configuration for HTTP request logging.
 * Controls what information is logged for HTTP requests.
 */
export interface RequestLoggingConfig {
    // Whether to log request bodies
    logRequestBody: boolean;

    // Whether to log response bodies
    logResponseBody: boolean;

    // Maximum length for logged bodies
    maxBodyLength: number;

    // Headers to include in logs
    includedHeaders: string[];

    // Paths to exclude from logging
    excludePaths: string[];

    // Whether to log query parameters
    logQueryParams: boolean;

    // Whether to log route parameters
    logRouteParams: boolean;

    // Whether to measure and log request timing
    logTiming: boolean;
}

/**
 * Options for formatting log output.
 * Controls how logs are presented and structured.
 */
export interface LogFormatterOptions {
    // Whether to colorize console output
    colorize: boolean;

    // Whether to include timestamps
    timestamp: boolean;

    // Whether to pretty-print JSON
    prettyPrint: boolean;

    // Maximum depth for JSON serialization
    maxDepth: number;

    // Fields to exclude from logs
    excludeFields: string[];

    // Whether to humanize error stacks
    humanizeErrors: boolean;

    // Whether to format timestamps as ISO strings
    isoTimestamp: boolean;

    // Labels for log levels
    levelLabels?: Record<string, string>;
}
