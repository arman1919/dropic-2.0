import mongoose from 'mongoose';

/**
 * Cached mongoose connection across hot reloads in dev.
 */
const globalWithMongoose = global as typeof globalThis & {
  mongooseConn?: typeof mongoose | null;
};

export async function connectDB() {
  if (globalWithMongoose.mongooseConn) return globalWithMongoose.mongooseConn;

  const uri = process.env.MONGODB_URI || process.env.NEXT_PUBLIC_MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI env var not set');

  const conn = await mongoose.connect(uri, {
    dbName: process.env.MONGODB_DB || undefined,
  });

  globalWithMongoose.mongooseConn = conn;
  return conn;
}
