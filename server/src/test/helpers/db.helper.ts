import mongoose from 'mongoose';
import { env } from '../../config/env';

export async function connectTestDb(uri: string = env.mongodbUri): Promise<void> {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
  }
}

export async function disconnectTestDb(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

export async function clearDb(): Promise<void> {
  const collections = mongoose.connection.collections;
  for (const name of Object.keys(collections)) {
    await collections[name].deleteMany({});
  }
}

export async function dropTestDb(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
  }
}
