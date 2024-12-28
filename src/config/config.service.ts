import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import { AppConfig } from './interfaces/app-config.interface';
import {
    parseAllowedOrigins,
    validateEnvironmentConfig,
    validateJwtConfig,
    validateRedisConfig,
} from './validation/env.validation';

@Injectable()
export class ConfigService {
    private readonly config: AppConfig;
    private readonly nestConfigService: NestConfigService;

    constructor(config: NestConfigService) {
        this.nestConfigService = config;
        this.config = this.loadConfiguration();
    }

    private loadConfiguration() {
        // Get raw environment variables
        const rawConfig = {
            port: this.nestConfigService.get<number>('PORT'),
            environment: this.nestConfigService.get<string>('NODE_ENV'),
            apiPrefix: this.nestConfigService.get<string>('API_PREFIX'),
            domain: this.nestConfigService.get<string>('DOMAIN'),
            allowedOrigins: parseAllowedOrigins(this.nestConfigService.get<string>('ALLOWED_ORIGINS')),

            // Database configuration
            database: {
                host: this.nestConfigService.get<string>('DB_HOST'),
                port: this.nestConfigService.get<number>('DB_PORT'),
                username: this.nestConfigService.get<string>('DB_USERNAME'),
                password: this.nestConfigService.get<string>('DB_PASSWORD'),
                database: this.nestConfigService.get<string>('DB_DATABASE'),
                synchronize: this.nestConfigService.get<string>('NODE_ENV') !== 'production',
                logging: this.nestConfigService.get<string>('NODE_ENV') === 'development',
            },

            // Redis configuration
            redis: validateRedisConfig({
                host: this.nestConfigService.get<string>('REDIS_HOST'),
                port: this.nestConfigService.get<number>('REDIS_PORT'),
                password: this.nestConfigService.get<string>('REDIS_PASSWORD'),
                db: this.nestConfigService.get<number>('REDIS_DB'),
                keyPrefix: `${this.nestConfigService.get<string>('NODE_ENV')}:`,
            }),

            // JWT configuration
            jwt: validateJwtConfig({
                secret: this.nestConfigService.get<string>('JWT_SECRET'),
                expiresIn: this.nestConfigService.get<string>('JWT_EXPIRES_IN'),
                refreshExpiresIn: this.nestConfigService.get<string>('JWT_REFRESH_EXPIRES_IN'),
            }),

            // OAuth configuration
            oauth: {
                clientId: this.nestConfigService.get<string>('OAUTH_CLIENT_ID'),
                clientSecret: this.nestConfigService.get<string>('OAUTH_CLIENT_SECRET'),
                callbackUrl: this.nestConfigService.get<string>('OAUTH_CALLBACK_URL'),
                scope: ['email', 'profile'], // Default scopes, can be extended
                providers: {
                    google: {
                        clientId: this.nestConfigService.get<string>('GOOGLE_CLIENT_ID'),
                        clientSecret: this.nestConfigService.get<string>('GOOGLE_CLIENT_SECRET'),
                        callbackUrl: this.nestConfigService.get<string>('GOOGLE_CALLBACK_URL'),
                    },
                    github: {
                        clientId: this.nestConfigService.get<string>('GITHUB_CLIENT_ID'),
                        clientSecret: this.nestConfigService.get<string>('GITHUB_CLIENT_SECRET'),
                        callbackUrl: this.nestConfigService.get<string>('GITHUB_CALLBACK_URL'),
                    },
                },
            },

            // Security configuration
            security: {
                bcryptSaltRounds: this.nestConfigService.get<number>('BCRYPT_SALT_ROUNDS'),
                sessionSecret: this.nestConfigService.get<string>('SESSION_SECRET'),
                corsEnabled: true,
                csrfEnabled: this.nestConfigService.get<string>('NODE_ENV') === 'production',
            },

            // Rate limiting configuration
            rateLimit: {
                windowMs: 15 * 60 * 1000, // 15 minutes
                max: 100, // Limit each IP to 100 requests per windowMs
            },

            // Logging configuration
            logging: {
                level: this.nestConfigService.get<string>('LOG_LEVEL') || 'info',
                format: this.nestConfigService.get<string>('LOG_FORMAT') || 'json',
                filepath: this.nestConfigService.get<string>('LOG_FILE_PATH'),
            },
        };

        // Validate the entire configuration object
        return validateEnvironmentConfig(rawConfig) as unknown as AppConfig;
    }

    getConfig(): Readonly<AppConfig> {
        return this.config;
    }

    /**
     * Public method to get a specific configuration value
     * @param key - The configuration key to retrieve
     */
    get<T = any>(key: keyof AppConfig): T {
        return this.config[key] as T;
    }
}
