/**
 * Base configuration for all environment variables
 * Provides type safety for configuration values used across the application
 */
export interface AppConfig {
    // Server configuration
    port: number;
    environment: 'development' | 'production' | 'test';
    apiPrefix: string;

    // Domain configuration for CORS and cookies
    domain: string;
    allowedOrigins: string[];

    // API rate limiting
    rateLimit: {
        windowMs: number;
        max: number;
    };

    // JWT configuration
    jwt: {
        secret: string;
        expiresIn: string;
        refreshExpiresIn: string;
    };

    // Database configuration
    database: {
        host: string;
        port: number;
        username: string;
        password: string;
        database: string;
        synchronize: boolean;
        logging: boolean;
    };

    // Redis configuration for caching
    redis: {
        host: string;
        port: number;
        password?: string;
        db: number;
        keyPrefix: string;
    };

    // OAuth2.0 configuration
    oauth: {
        clientId: string;
        clientSecret: string;
        callbackUrl: string;
        scope: string[];
        // Additional provider-specific configurations can be added here
        providers: {
            google?: {
                clientId: string;
                clientSecret: string;
                callbackUrl: string;
            };
            github?: {
                clientId: string;
                clientSecret: string;
                callbackUrl: string;
            };
            // Add other OAuth providers as needed
        };
    };

    // Security configurations
    security: {
        bcryptSaltRounds: number;
        sessionSecret: string;
        corsEnabled: boolean;
        csrfEnabled: boolean;
    };

    // Logging configuration
    logging: {
        level: 'error' | 'warn' | 'info' | 'debug';
        format: 'json' | 'text';
        filepath?: string;
    };
}

/**
 * Environment-specific configuration interface
 * Used for loading different configurations based on the environment
 */
export interface EnvironmentConfig {
    production: AppConfig;
    development: AppConfig;
    test: AppConfig;
}

/**
 * Configuration validation schema interface
 * Used for validating environment variables during application bootstrap
 */
export interface ConfigValidationSchema {
    PORT: number;
    NODE_ENV: string;
    API_PREFIX: string;
    DOMAIN: string;
    ALLOWED_ORIGINS: string;

    // Database
    DB_HOST: string;
    DB_PORT: number;
    DB_USERNAME: string;
    DB_PASSWORD: string;
    DB_DATABASE: string;

    // JWT
    JWT_SECRET: string;
    JWT_EXPIRES_IN: string;
    JWT_REFRESH_EXPIRES_IN: string;

    // Redis
    REDIS_HOST: string;
    REDIS_PORT: number;
    REDIS_PASSWORD?: string;
    REDIS_DB: number;

    // OAuth
    OAUTH_CLIENT_ID: string;
    OAUTH_CLIENT_SECRET: string;
    OAUTH_CALLBACK_URL: string;

    // Security
    BCRYPT_SALT_ROUNDS: number;
    SESSION_SECRET: string;

    // Logging
    LOG_LEVEL: string;
    LOG_FORMAT: string;
    LOG_FILE_PATH?: string;
}
