import { LogLevel } from '@nestjs/common';

/**
 * Configuration options for the logging system.
 * These settings control how logs are formatted, stored, and managed.
 */
export interface LoggerConfig {
    // The minimum level of logs to process
    level: LogLevel;

    // Whether to pretty-print JSON logs in development
    prettyPrint: boolean;

    // Directory where log files should be stored
    logDir?: string;

    // Maximum size of each log file before rotation
    maxFileSize?: string;

    // Maximum number of days to keep logs
    maxDays?: number;

    // Whether to log to console in addition to files
    console: boolean;

    // Additional fields to include in every log entry
    defaultMeta?: Record<string, any>;

    // Format for timestamps in log entries
    timestampFormat: string;

    // Whether to include request correlation IDs
    correlationId: boolean;

    // List of sensitive fields to redact from logs
    redactedFields: string[];

    // Whether to capture stack traces for errors
    captureStackTrace: boolean;

    // Whether to include host and process information
    includeMetadata: boolean;
}

/**
 * Options for configuring log rotation.
 * Helps manage log file sizes and retention.
 */
export interface LogRotationConfig {
    // Maximum size of a single log file
    maxSize: string;

    // Maximum number of backup files to keep
    maxFiles: number;

    // Whether to compress rotated logs
    compress: boolean;

    // Pattern for naming rotated log files
    pattern: string;
}
