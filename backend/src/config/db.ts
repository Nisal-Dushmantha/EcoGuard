import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('❌ MONGODB_URI is not defined in your .env file.');
    return;
  }

  try {
    console.log('⏳ Connecting to MongoDB...');
    const conn = await mongoose.connect(uri, {
      dbName: process.env.MONGODB_DB_NAME || 'ecoguard',
      serverSelectionTimeoutMS: 5000, // Timeout after 5s if Atlas network/IP is not reachable
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host} (Database: ${conn.connection.name})`);
  } catch (error: any) {
    console.error('❌ MongoDB Connection Error:', error?.message || error);
    console.info('💡 Note: If using MongoDB Atlas, make sure your current IP address is whitelisted in Atlas Network Access (or 0.0.0.0/0 for testing).');
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected.');
});

mongoose.connection.on('reconnected', () => {
  console.log('🔄 MongoDB reconnected.');
});
