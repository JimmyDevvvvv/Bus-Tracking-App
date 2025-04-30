import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        // Check if MONGO_URI is defined, use a fallback if not
        const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/bus-tracking';
        console.log('Connecting to MongoDB with URI:', uri);
        
        const conn = await mongoose.connect(uri);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`MongoDB Connection Error: ${error.message}`);
        process.exit(1);
    }
};

export default connectDB;
