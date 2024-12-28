import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { ConfigService } from './config.service';

/**
 * Global configuration module that makes our configuration service
 * available throughout the application. This module combines NestJS's
 * built-in configuration capabilities with our custom validation and
 * type safety features.
 */
@Global()
@Module({
    imports: [
        NestConfigModule.forRoot({
            isGlobal: true,
            envFilePath: [
                `.env.${process.env.NODE_ENV || 'development'}.local`,
                `.env.${process.env.NODE_ENV || 'development'}`,
                '.env.local',
                '.env',
            ],
            validationSchema: Joi.object({
                // Server configuration validation
                PORT: Joi.number().default(3000),
                NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
                API_PREFIX: Joi.string().default('api'),
                DOMAIN: Joi.string().required(),
                ALLOWED_ORIGINS: Joi.string().required(),

                // Database validation
                DB_HOST: Joi.string().required(),
                DB_PORT: Joi.number().required(),
                DB_USERNAME: Joi.string().required(),
                DB_PASSWORD: Joi.string().required(),
                DB_DATABASE: Joi.string().required(),

                // Redis validation
                REDIS_HOST: Joi.string().required(),
                REDIS_PORT: Joi.number().required(),
                REDIS_PASSWORD: Joi.string().optional(),
                REDIS_DB: Joi.number().default(0),

                // JWT validation
                JWT_SECRET: Joi.string().min(32).required(),
                JWT_EXPIRES_IN: Joi.string()
                    .pattern(/^\d+[smhd]$/)
                    .required(),
                JWT_REFRESH_EXPIRES_IN: Joi.string()
                    .pattern(/^\d+[smhd]$/)
                    .required(),

                // OAuth validation
                OAUTH_CLIENT_ID: Joi.string().required(),
                OAUTH_CLIENT_SECRET: Joi.string().required(),
                OAUTH_CALLBACK_URL: Joi.string().uri().required(),

                // Optional OAuth providers
                GOOGLE_CLIENT_ID: Joi.string().optional(),
                GOOGLE_CLIENT_SECRET: Joi.string().optional(),
                GOOGLE_CALLBACK_URL: Joi.string().uri().optional(),

                GITHUB_CLIENT_ID: Joi.string().optional(),
                GITHUB_CLIENT_SECRET: Joi.string().optional(),
                GITHUB_CALLBACK_URL: Joi.string().uri().optional(),

                // Security validation
                BCRYPT_SALT_ROUNDS: Joi.number().min(8).max(16).default(10),
                SESSION_SECRET: Joi.string().min(32).required(),

                // Rate limiting
                RATE_LIMIT_MAX: Joi.number().default(100),

                // Logging validation
                LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
                LOG_FORMAT: Joi.string().valid('json', 'text').default('json'),
                LOG_FILE_PATH: Joi.string().optional(),
            }),
            validationOptions: {
                abortEarly: false,
            },
        }),
    ],
    providers: [ConfigService],
    exports: [ConfigService],
})
export class ConfigModule {
    /**
     * Creates an asynchronous configuration module.
     * This is useful when configuration needs to be loaded asynchronously,
     * though in most cases the synchronous module is sufficient.
     */
    static forRootSync(): DynamicModule {
        return {
            module: ConfigModule,
            imports: [NestConfigModule],
            providers: [ConfigService],
            exports: [ConfigService],
        };
    }
}
