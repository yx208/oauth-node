// src/logging/logging.service.ts

import { Injectable, LogLevel } from '@nestjs/common';
import * as winston from 'winston';
import { hostname } from 'os';
import { Request, Response } from 'express';
import { ConfigService } from '../config/config.service';
import { LoggerConfig, LogEntry, RequestLoggingConfig } from './interfaces';

/**
 * Core logging service that provides structured logging capabilities throughout the application.
 * This service implements different logging strategies and handles log formatting, storage,
 * and rotation while ensuring sensitive data is properly protected.
 */
@Injectable()
export class LoggingService {
    private readonly logger: winston.Logger;
    private readonly config: LoggerConfig;
    private readonly requestConfig: RequestLoggingConfig;

    constructor(private readonly configService: ConfigService) {
        // Load logging configuration from our config service
        this.config = this.loadLoggerConfig();
        this.requestConfig = this.loadRequestLoggingConfig();

        // Initialize Winston logger with our configuration
        this.logger = this.initializeLogger();
    }

    /**
     * Loads logger configuration from the application config service.
     * This sets up how our logging system will behave.
     */
    private loadLoggerConfig(): LoggerConfig {
        const loggingConfig = this.configService.get('logging');
        return {
            level: loggingConfig.level as LogLevel,
            prettyPrint: this.configService.get('environment') === 'development',
            logDir: loggingConfig.filepath,
            console: true,
            timestampFormat: 'YYYY-MM-DD HH:mm:ss',
            correlationId: true,
            redactedFields: ['password', 'token', 'secret', 'authorization'],
            captureStackTrace: true,
            includeMetadata: true,
        };
    }

    /**
     * Loads request logging configuration to determine what request/response
     * information should be logged.
     */
    private loadRequestLoggingConfig(): RequestLoggingConfig {
        return {
            logRequestBody: true,
            logResponseBody: true,
            maxBodyLength: 10000,
            includedHeaders: ['user-agent', 'host', 'referer'],
            excludePaths: ['/health', '/metrics'],
            logQueryParams: true,
            logRouteParams: true,
            logTiming: true,
        };
    }

    /**
     * Initializes the Winston logger with our desired configuration.
     * This sets up log transports, formats, and handling.
     */
    private initializeLogger(): winston.Logger {
        const { format } = winston;

        // Create base log formatter
        const baseFormat = format.combine(
            format.timestamp({ format: this.config.timestampFormat }),
            format.errors({ stack: this.config.captureStackTrace }),
            this.createRedactionFormat(),
            this.createCustomFormat(),
        );

        // Create console transport if enabled
        const transports: winston.transport[] = [];
        if (this.config.console) {
            transports.push(
                new winston.transports.Console({
                    format: format.combine(baseFormat, this.config.prettyPrint ? format.prettyPrint() : format.json()),
                }),
            );
        }

        // Create file transport if directory is specified
        if (this.config.logDir) {
            transports.push(
                new winston.transports.File({
                    filename: `${this.config.logDir}/error.log`,
                    level: 'error',
                    format: baseFormat,
                }),
            );
            transports.push(
                new winston.transports.File({
                    filename: `${this.config.logDir}/combined.log`,
                    format: baseFormat,
                }),
            );
        }

        return winston.createLogger({
            level: this.config.level,
            transports,
        });
    }

    /**
     * Creates a custom format that adds additional metadata to log entries.
     * This includes system information and correlation IDs.
     */
    private createCustomFormat() {
        return winston.format((info) => {
            if (this.config.includeMetadata) {
                info.context = {
                    hostname: hostname(),
                    pid: process.pid,
                    memory: process.memoryUsage(),
                };
            }
            return info;
        })();
    }

    /**
     * Creates a format that redacts sensitive information from logs.
     * This helps prevent accidental logging of sensitive data.
     */
    private createRedactionFormat() {
        return winston.format((info) => {
            this.redactSensitiveData(info, this.config.redactedFields);
            return info;
        })();
    }

    /**
     * Recursively redacts sensitive fields from objects before logging.
     * This ensures sensitive data is not written to logs.
     */
    private redactSensitiveData(obj: any, fields: string[], depth = 0) {
        if (depth > 10 || !obj || typeof obj !== 'object') return;

        for (const key in obj) {
            if (fields.includes(key.toLowerCase())) {
                obj[key] = '[REDACTED]';
            } else if (typeof obj[key] === 'object') {
                this.redactSensitiveData(obj[key], fields, depth + 1);
            }
        }
    }

    /**
     * Creates a log entry structure with consistent formatting.
     * This ensures all logs follow the same structure.
     */
    private createLogEntry(level: string, message: string, meta?: any): LogEntry {
        return {
            timestamp: new Date().toISOString(),
            level,
            message,
            correlationId: meta?.correlationId,
            service: meta?.service,
            error: meta?.error,
            request: meta?.request,
            response: meta?.response,
            user: meta?.user,
            metadata: meta?.metadata,
            context: this.config.includeMetadata
                ? {
                      hostname: hostname(),
                      pid: process.pid,
                      memory: {
                          heapUsed: process.memoryUsage().heapUsed,
                          heapTotal: process.memoryUsage().heapTotal,
                      },
                  }
                : undefined,
        };
    }

    /**
     * Logs an HTTP request with configured detail level.
     * This method handles request logging with proper redaction and formatting.
     */
    logRequest(req: Request, correlationId?: string) {
        if (this.requestConfig.excludePaths.includes(req.path)) return;

        const requestLog = {
            method: req.method,
            url: req.url,
            headers: {},
            body: undefined,
            params: undefined,
            query: undefined,
        };

        // Add configured headers
        this.requestConfig.includedHeaders.forEach((header) => {
            const headerValue = req.headers[header];
            if (headerValue) {
                requestLog.headers[header] = headerValue;
            }
        });

        // Add body if configured
        if (this.requestConfig.logRequestBody && req.body) {
            requestLog.body = this.truncateBody(req.body);
        }

        // Add params if configured
        if (this.requestConfig.logRouteParams && req.params) {
            requestLog.params = req.params;
        }

        // Add query if configured
        if (this.requestConfig.logQueryParams && req.query) {
            requestLog.query = req.query;
        }

        this.info('Incoming request', { request: requestLog, correlationId });
    }

    /**
     * Logs an HTTP response with configured detail level.
     * This method handles response logging with proper redaction and formatting.
     */
    logResponse(res: Response, startTime?: [number, number], correlationId?: string) {
        const responseLog = {
            statusCode: res.statusCode,
            headers: res.getHeaders(),
            body: undefined,
            timing: undefined,
        };

        // Add timing if configured and startTime provided
        if (this.requestConfig.logTiming && startTime) {
            const [seconds, nanoseconds] = process.hrtime(startTime);
            responseLog.timing = seconds * 1000 + nanoseconds / 1000000;
        }

        // Add body if configured and available
        if (this.requestConfig.logResponseBody && res.locals.bodyContent) {
            responseLog.body = this.truncateBody(res.locals.bodyContent);
        }

        this.info('Outgoing response', { response: responseLog, correlationId });
    }

    /**
     * Truncates request/response bodies to prevent excessive log sizes.
     */
    private truncateBody(body: any): any {
        const stringified = JSON.stringify(body);
        if (stringified.length <= this.requestConfig.maxBodyLength) {
            return body;
        }
        return {
            _truncated: true,
            preview: stringified.substring(0, this.requestConfig.maxBodyLength) + '...',
        };
    }

    /**
     * Logs messages at different levels with consistent formatting.
     * These methods are the main interface for logging throughout the application.
     */
    debug(message: string, meta?: any) {
        this.logger.debug(message, this.createLogEntry('debug', message, meta));
    }

    info(message: string, meta?: any) {
        this.logger.info(message, this.createLogEntry('info', message, meta));
    }

    warn(message: string, meta?: any) {
        this.logger.warn(message, this.createLogEntry('warn', message, meta));
    }

    error(message: string, error?: Error, meta?: any) {
        this.logger.error(
            message,
            this.createLogEntry('error', message, {
                ...meta,
                error: error
                    ? {
                          name: error.name,
                          message: error.message,
                          stack: this.config.captureStackTrace ? error.stack : undefined,
                          ...(error as any),
                      }
                    : undefined,
            }),
        );
    }
}
