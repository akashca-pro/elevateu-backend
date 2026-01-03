import mongoose from "mongoose";
import 'dotenv/config'

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL, {
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000,
            maxPoolSize: 10,
            retryWrites: true,
        });
        console.log("mongoDB connected...");
    } catch (error) {
        console.log("mongoDB connection failed", error.message);
        process.exit(1);
    }
}

// Handle connection events
mongoose.connection.on('error', err => {
    console.error('MongoDB connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected. Attempting to reconnect...');
});

mongoose.connection.on('reconnected', () => {
    console.log('MongoDB reconnected');
});

export default connectDB