//for having database connection

// db connection may bring errors, to try catch

// also db is in another continnet so use 

import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(process.env.MONGODB_URL, {
            dbName: process.env.DB_NAME,
            serverSelectionTimeoutMS: 8000, // Wait 5 seconds before failing
        });

        console.log(`\n ✅ MongoDB Connected! DB Host: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.error("❌ MongoDB connection error:", error.message);
        process.exit(1);
    }
};


export default connectDB;