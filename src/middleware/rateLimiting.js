import { rateLimit } from 'express-rate-limit';
import logger from '../utils/logger.js';

// Create a custom handler for rate limit exceeded
const createRateLimitHandler = (message) => (req, res) => {
    logger.warn({ 
        ip: req.ip, 
        path: req.path, 
        method: req.method 
    }, `Rate limit exceeded: ${message}`);
    
    res.status(429).json({
        success: false,
        message,
        retryAfter: res.getHeader('Retry-After')
    });
};

// Strict limiter - For sensitive operations (login, OTP, password reset)
// 3 requests per 15 minutes
export const strictLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 3,
    message: "Too many attempts. Please try again after 15 minutes.",
    standardHeaders: true,
    legacyHeaders: false,
    handler: createRateLimitHandler("Too many attempts. Please try again after 15 minutes."),
    skipSuccessfulRequests: false,
});

// Auth limiter - For authentication operations (signup, verify)
// 10 requests per 15 minutes
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: "Too many authentication attempts. Please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
    handler: createRateLimitHandler("Too many authentication attempts. Please try again later."),
});

// Standard limiter - For write operations (POST, PUT, PATCH, DELETE)
// 100 requests per 15 minutes
export const standardLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many requests. Please slow down.",
    standardHeaders: true,
    legacyHeaders: false,
    handler: createRateLimitHandler("Too many requests. Please slow down."),
});

// Read limiter - For GET operations on authenticated routes
// 200 requests per 15 minutes
export const readLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: "Too many requests. Please slow down.",
    standardHeaders: true,
    legacyHeaders: false,
    handler: createRateLimitHandler("Too many requests. Please slow down."),
});

// Public limiter - For public unauthenticated routes
// 50 requests per 15 minutes
export const publicLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    message: "Too many requests from this IP. Please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
    handler: createRateLimitHandler("Too many requests from this IP. Please try again later."),
});

// Legacy exports for backward compatibility
export const otpLimiter = strictLimiter;
export const loginLimiter = strictLimiter;
