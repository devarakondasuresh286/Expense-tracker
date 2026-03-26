import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let memoryServer;

const shouldUseMemoryFallback = () => {
  const value = String(process.env.USE_IN_MEMORY_DB || '').toLowerCase();
  return value === '1' || value === 'true' || value === 'yes';
};

const connectWithMemoryServer = async () => {
  if (!memoryServer) {
    memoryServer = await MongoMemoryServer.create();
  }

  const memoryUri = memoryServer.getUri();
  await mongoose.connect(memoryUri, {
    autoIndex: true,
  });

  console.warn('Connected using in-memory MongoDB. Data will be lost on restart.');
};

export const connectDb = async (mongoUri) => {
  try {
    await mongoose.connect(mongoUri, {
      autoIndex: true,
      serverSelectionTimeoutMS: 5000,
    });
  } catch (error) {
    if (!shouldUseMemoryFallback()) {
      throw error;
    }

    console.warn(`Primary MongoDB connection failed (${error.message}). Falling back to in-memory DB.`);
    await connectWithMemoryServer();
  }
};
