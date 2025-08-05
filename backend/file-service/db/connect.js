import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`File Service MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('File Service Database connection error:', error);
    process.exit(1);
  }
};

export default connectDB; 