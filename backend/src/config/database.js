import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDatabase(uri = env.mongodbUri) {
  if (!uri) {
    throw new Error('Database URI is missing.');
  }

  mongoose.set('strictQuery', true);

  const connection = await mongoose.connect(uri, {
    autoIndex: !env.isProduction,
    serverSelectionTimeoutMS: 10000,
  });

  return connection;
}

export async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}
