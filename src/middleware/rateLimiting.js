import { rateLimit } from 'express-rate-limit'

export const otpLimiter = rateLimit({
    windowMs : 10 * 60 * 1000,
    max : 3,
    message : "Too many OTP verification attempts. Try again later",
    standardHeaders : true,
    legacyHeaders : true
});

export const loginLimiter = rateLimit({
    windowMs : 10 * 60 * 1000,
    max : 5,
    message : "Too many login attempts.. Try again later",
    standardHeaders : true,
    legacyHeaders : true
})
