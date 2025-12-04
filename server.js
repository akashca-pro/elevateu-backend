// server
import './src/cron/deleteReadedMessages.js'
import http from 'http'
import express from 'express'
import 'dotenv/config'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import connectDB from './src/config/db.js'

import userRouter from './src/routes/user.js'
import tutorRouter from './src/routes/tutor.js'
import adminRouter from './src/routes/admin.js'
import commonRouter from './src/routes/common.js'

import {errorHandler,notFound} from './src/middleware/errorHandling.js'
import passport from './src/config/passport.js'
import { initializeSocket } from './src/services/socketServer.js'

connectDB();

const app= express()
const server = http.createServer(app);

const io = initializeSocket(server);

app.use((req, res, next) => {
    req.io = io;
    next();
});
  
app.use(passport.initialize())

app.use(cors({
    credentials : true,
    origin : [process.env.CLIENT_URL,process.env.CLIENT_URL_2]
}))

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({extended : true}));

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

server.listen(process.env.PORT || 9000,()=>{
    console.log(`Server started on http://localhost:${process.env.PORT}`)
})