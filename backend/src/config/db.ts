import dns from 'dns';
import mongoose, { ConnectOptions } from 'mongoose';

// Configure public DNS servers (Google and Cloudflare) to ensure MongoDB SRV records
// resolve properly even when local ISP/mobile hotspot DNS fails.
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Ignore if permissions or platform restricts setServers
}

const customResolver = new dns.Resolver();
try {
  customResolver.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Ignore if not permitted
}

const customLookup = (
  hostname: string,
  options: any,
  callback: (err: NodeJS.ErrnoException | null, address?: any, family?: number) => void
) => {
  const cb = typeof options === 'function' ? options : callback;
  const opts = typeof options === 'object' ? options : {};

  dns.lookup(hostname, opts, (err, address, family) => {
    if (!err) {
      return cb(null, address, family);
    }

    // Fallback to custom public DNS resolver if OS DNS lookup fails
    customResolver.resolve4(hostname, (resErr, addresses) => {
      if (resErr || !addresses || addresses.length === 0) {
        return cb(err);
      }

      if (opts && opts.all) {
        return cb(null, addresses.map(addr => ({ address: addr, family: 4 })));
      }

      return cb(null, addresses[0], 4);
    });
  });
};

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
      serverSelectionTimeoutMS: 10000,
      lookup: customLookup,
    } as ConnectOptions);

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
