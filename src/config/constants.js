// Centralized constants for token expiry and other magic values
import 'dotenv/config'

export const TOKEN_EXPIRY = Object.freeze({
    ACCESS: 24 * 60 * 60 * 1000,      // 24 hours in milliseconds
    REFRESH: 7 * 24 * 60 * 60 * 1000,  // 7 days in milliseconds
    OTP: 5 * 60 * 1000,                // 5 minutes in milliseconds
});

export const TOKEN_NAMES = Object.freeze({
    user: {
        access: process.env.USER_ACCESS_TOKEN_NAME,
        refresh: process.env.USER_REFRESH_TOKEN_NAME
    },
    tutor: {
        access: process.env.TUTOR_ACCESS_TOKEN_NAME,
        refresh: process.env.TUTOR_REFRESH_TOKEN_NAME
    },
    admin: {
        access: process.env.ADMIN_ACCESS_TOKEN_NAME,
        refresh: process.env.ADMIN_REFRESH_TOKEN_NAME
    }
});

export const RATE_LIMITS = Object.freeze({
    LOGIN: {
        windowMs: 10 * 60 * 1000,  // 10 minutes
        max: 5
    },
    OTP: {
        windowMs: 10 * 60 * 1000,  // 10 minutes
        max: 3
    }
});

export const BCRYPT_SALT_ROUNDS = 10;

export const PAGINATION = Object.freeze({
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100
});
