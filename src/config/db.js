import mongoose from "mongoose";
import 'dotenv/config'

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
          console.log("mongoDB connected...");
    } catch (error) {
        console.log("mongoDB connection failed",error);
        process.exit(1);
    }
}

export default connectDB