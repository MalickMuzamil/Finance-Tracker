import mongoose from 'mongoose';
import { mongoUri } from './env.js';

export async function connectDB() {
  if (!mongoUri) throw new Error('MONGODB_URI is required in environment variables');
  await mongoose.connect(mongoUri);
  console.log('MongoDB connected successfully');
}

export default connectDB;
