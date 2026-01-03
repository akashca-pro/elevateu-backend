import pino from 'pino';
import 'dotenv/config';

const isProduction = process.env.NODE_ENV === 'production';

// Create the base logger configuration
const loggerConfig = {
    level: process.env.LOG_LEVEL || 'debug',
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
        }
    },
    base: {
        env: process.env.NODE_ENV || 'development',
    },
    timestamp: pino.stdTimeFunctions.isoTime,
};

// Create the main logger instance
const logger = pino(loggerConfig);

// Create child loggers for different modules
export const createModuleLogger = (moduleName) => {
    return logger.child({ module: moduleName });
};

// Predefined module loggers
export const dbLogger = createModuleLogger('database');
export const authLogger = createModuleLogger('auth');
export const apiLogger = createModuleLogger('api');
export const socketLogger = createModuleLogger('socket');

// HTTP request serializers for pino-http
export const httpLoggerOptions = {
    logger: logger,
    autoLogging: true,
    customLogLevel: (req, res, err) => {
        if (res.statusCode >= 500 || err) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
    },
    customSuccessMessage: (req, res) => {
        return `${req.method} ${req.url} - ${res.statusCode}`;
    },
    customErrorMessage: (req, res, err) => {
        return `${req.method} ${req.url} - ${res.statusCode} - ${err.message}`;
    },
    serializers: {
        req: (req) => ({
            method: req.method,
            url: req.url,
            path: req.path,
            parameters: req.params,
            // Don't log sensitive headers
            headers: {
                'user-agent': req.headers['user-agent'],
                'content-type': req.headers['content-type'],
            }
        }),
        res: (res) => ({
            statusCode: res.statusCode,
        }),
    },
    // Don't log health check requests
    autoLogging: {
        ignore: (req) => req.url === '/health'
    }
};

export default logger;
