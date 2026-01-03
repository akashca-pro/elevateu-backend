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
import connectDB from './config/db.js'

import userRouter from './routes/user.js'
import tutorRouter from './routes/tutor.js'
import adminRouter from './routes/admin.js'
import commonRouter from './routes/common.js'

import {errorHandler,notFound} from './middleware/errorHandling.js'
import passport from './config/passport.js'
import { initializeSocket } from './services/socketServer.js'

// Connect to database with error handling
connectDB().catch(err => {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
});

const app = express()
const server = http.createServer(app);

const io = initializeSocket(server);

app.use((req, res, next) => {
    req.io = io;
    next();
});

// Security middleware
app.use(helmet());
app.use(mongoSanitize());
  
app.use(passport.initialize())

app.use(cors({
  origin: [process.env.CLIENT_URL, process.env.CLIENT_URL_2],
  credentials: true,
  methods: ['GET', 'POST', 'PUT','PATCH','DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Set-Cookie'],
}));

// Improved health check with database status
app.get("/health", async (req, res) => {
  const dbState = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.status(200).json({ 
    status: "ok",
    timestamp: new Date().toISOString(),
    database: dbState,
    uptime: process.uptime()
  });
});

// Request size limits for security
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// Common routes
app.use('/api',commonRouter)

//User Route
app.use('/api/user',userRouter);

//Tutor route
app.use('/api/tutor',tutorRouter)

//Admin route
app.use('/api/admin',adminRouter) 

//error handling
app.use(notFound)
app.use(errorHandler)

const PORT = process.env.PORT || 9000;

server.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`)
})

// Graceful shutdown handling
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully');
    server.close(() => {
        mongoose.connection.close(false).then(() => {
            console.log('MongoDB connection closed');
            process.exit(0);
        });
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received. Shutting down gracefully');
    server.close(() => {
        mongoose.connection.close(false).then(() => {
            console.log('MongoDB connection closed');
            process.exit(0);
        });
    });
});