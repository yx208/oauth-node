// src/config/validation/env.validation.ts

import { plainToClass } from 'class-transformer';
import {
    IsString,
    IsNumber,
    IsEnum,
    IsUrl,
    IsOptional,
    validateSync,
    Min,
    Max,
    MinLength,
    Matches,
} from 'class-validator';
import { ConfigValidationSchema } from '../interfaces/app-config.interface';

/**
 * Environment values that are considered valid for the application
 */
enum Environment {
    Development = 'development',
    Production = 'production',
    Test = 'test',
}

/**
 * Represents the environment configuration with validation rules
 * Uses class-validator decorators to ensure all values meet requirements
 */
class EnvironmentVariables implements ConfigValidationSchema {
    @IsNumber()
    @Min(1)
    @Max(65535)
    PORT: number;

    @IsEnum(Environment)
    NODE_ENV: string;

    @IsString()
    API_PREFIX: string;

    @IsString()
    DOMAIN: string;

    @IsString()
    @IsOptional()
    ALLOWED_ORIGINS: string;

    // Database validation
    @IsString()
    DB_HOST: string;

    @IsNumber()
    @Min(1)
    @Max(65535)
    DB_PORT: number;

    @IsString()
    DB_USERNAME: string;

    @IsString()
    DB_PASSWORD: string;

    @IsString()
    DB_DATABASE: string;

    // JWT validation
    @IsString()
    @MinLength(32)
    JWT_SECRET: string;

    @IsString()
    @Matches(/^\d+[smhd]$/)
    JWT_EXPIRES_IN: string;

    @IsString()
    @Matches(/^\d+[smhd]$/)
    JWT_REFRESH_EXPIRES_IN: string;

    // Redis validation
    @IsString()
    REDIS_HOST: string;

    @IsNumber()
    @Min(1)
    @Max(65535)
    REDIS_PORT: number;

    @IsString()
    @IsOptional()
    REDIS_PASSWORD?: string;

    @IsNumber()
    @Min(0)
    @Max(15)
    REDIS_DB: number;

    // OAuth validation
    @IsString()
    OAUTH_CLIENT_ID: string;

    @IsString()
    OAUTH_CLIENT_SECRET: string;

    @IsUrl()
    OAUTH_CALLBACK_URL: string;

    // Security validation
    @IsNumber()
    @Min(8)
    @Max(16)
    BCRYPT_SALT_ROUNDS: number;

    @IsString()
    @MinLength(32)
    SESSION_SECRET: string;

    // Logging validation
    @IsEnum(['error', 'warn', 'info', 'debug'])
    LOG_LEVEL: string;

    @IsEnum(['json', 'text'])
    LOG_FORMAT: string;

    @IsString()
    @IsOptional()
    LOG_FILE_PATH?: string;
}

/**
 * Validates the environment configuration against the defined schema
 * @param config - The configuration object to validate
 * @returns The validated configuration object
 * @throws {Error} If validation fails
 */
export function validateEnvironmentConfig(config: Record<string, unknown>) {
    const validatedConfig = plainToClass(EnvironmentVariables, config, { enableImplicitConversion: true });

    const errors = validateSync(validatedConfig, { skipMissingProperties: false });

    if (errors.length > 0) {
        throw new Error(errors.map((error) => Object.values(error.constraints)).join(', '));
    }

    return validatedConfig;
}

/**
 * Processes the ALLOWED_ORIGINS string into an array of valid origins
 * @param originsString - Comma-separated string of allowed origins
 * @returns Array of validated origin URLs
 */
export function parseAllowedOrigins(originsString: string): string[] {
    if (!originsString) {
        return [];
    }

    const origins = originsString.split(',').map((origin) => origin.trim());

    // Validate each origin is a valid URL
    origins.forEach((origin) => {
        try {
            new URL(origin);
        } catch {
            throw new Error(`Invalid origin URL: ${origin}`);
        }
    });

    return origins;
}

/**
 * Ensures Redis configuration is valid and complete
 * @param config - The configuration object containing Redis settings
 * @throws {Error} If Redis configuration is invalid
 */
export function validateRedisConfig(config: Record<string, unknown>) {
    if (!config.REDIS_HOST || !config.REDIS_PORT) {
        throw new Error('Redis host and port are required');
    }

    if (config.REDIS_PASSWORD === '') {
        // If password is empty string, convert to undefined for Redis client
        config.REDIS_PASSWORD = undefined;
    }

    return config;
}

/**
 * Validates JWT configuration values
 * @param config - The configuration object containing JWT settings
 * @throws {Error} If JWT configuration is invalid
 */
export function validateJwtConfig(config: Record<string, unknown>) {
    const { JWT_SECRET, JWT_EXPIRES_IN, JWT_REFRESH_EXPIRES_IN } = config;

    if (!JWT_SECRET || typeof JWT_SECRET !== 'string' || JWT_SECRET.length < 32) {
        throw new Error('JWT_SECRET must be at least 32 characters long');
    }

    const expirationRegex = /^\d+[smhd]$/;
    if (!expirationRegex.test(JWT_EXPIRES_IN as string)) {
        throw new Error('JWT_EXPIRES_IN must be in format: number + s|m|h|d');
    }

    if (!expirationRegex.test(JWT_REFRESH_EXPIRES_IN as string)) {
        throw new Error('JWT_REFRESH_EXPIRES_IN must be in format: number + s|m|h|d');
    }

    return config;
}
