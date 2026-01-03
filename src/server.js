// server
import './cron/deleteReadedMessages.js'
import http from 'http'
import express from 'express'
import mongoose from 'mongoose'
import 'dotenv/config'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import helmet from 'helmet'
import mongoSanitize from 'express-mongo-sanitize'
import pinoHttp from 'pino-http'
import swaggerUi from 'swagger-ui-express'
import connectDB from './config/db.js'
import swaggerSpec from './config/swagger.js'
import logger, { httpLoggerOptions, dbLogger } from './utils/logger.js'

import userRouter from './routes/user.js'
import tutorRouter from './routes/tutor.js'
import adminRouter from './routes/admin.js'
import commonRouter from './routes/common.js'

import {errorHandler,notFound} from './middleware/errorHandling.js'
import passport from './config/passport.js'
import { initializeSocket } from './services/socketServer.js'

// Connect to database with error handling
connectDB().catch(err => {
    dbLogger.error({ error: err.message }, 'Failed to connect to MongoDB');
    process.exit(1);
});

const app = express()
const server = http.createServer(app);

const io = initializeSocket(server);

app.use((req, res, next) => {
    req.io = io;
    next();
});

// HTTP Request logging
app.use(pinoHttp(httpLoggerOptions));

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
        }
    }
}));
app.use(mongoSanitize());
  
app.use(passport.initialize())

app.use(cors({
  origin: [process.env.CLIENT_URL, process.env.CLIENT_URL_2],
  credentials: true,
  methods: ['GET', 'POST', 'PUT','PATCH','DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Set-Cookie'],
}));

// Swagger Documentation - must be before other routes
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'ElevateU API Docs',
}));

// Swagger JSON download endpoint
app.get('/api/docs/json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="swagger.json"');
    res.send(swaggerSpec);
});

// Health check endpoint
app.get("/health", async (req, res) => {
  const dbState = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.status(200).json({ 
    status: "ok",
    timestamp: new Date().toISOString(),
    database: dbState,
    uptime: process.uptime()
  });
});

// Body parsers
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api', commonRouter)
app.use('/api/user', userRouter);
app.use('/api/tutor', tutorRouter)
app.use('/api/admin', adminRouter) 

// Error handling
app.use(notFound)
app.use(errorHandler)

const PORT = process.env.PORT || 9000;

server.listen(PORT, () => {
    logger.info({ port: PORT }, `Server started on http://localhost:${PORT}`)
    logger.info(`API Docs available at http://localhost:${PORT}/api/docs`)
})

// Graceful shutdown handling
process.on('SIGTERM', () => {
    logger.info('SIGTERM received. Shutting down gracefully');
    server.close(() => {
        mongoose.connection.close(false).then(() => {
            logger.info('MongoDB connection closed');
            process.exit(0);
        });
    });
});

process.on('SIGINT', () => {
    logger.info('SIGINT received. Shutting down gracefully');
    server.close(() => {
        mongoose.connection.close(false).then(() => {
            logger.info('MongoDB connection closed');
            process.exit(0);
        });
    });
});