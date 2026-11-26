import { createApp } from './app.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { env, validateEnv } from './config/env.js';
import { bootstrapAdminIfEnabled } from './services/auth.service.js';

async function startServer() {
  try {
    validateEnv();
    await connectDatabase();
    console.log('Connected to MongoDB');

    const bootstrappedAdmin = await bootstrapAdminIfEnabled();
    if (bootstrappedAdmin) {
      console.log(`Bootstrapped initial admin account: ${bootstrappedAdmin.email}`);
    }

    const app = createApp();
    const server = app.listen(env.port, () => {
      console.log(`Support Ticket API listening on port ${env.port} (${env.nodeEnv})`);
    });

    const shutdown = async (signal) => {
      console.log(`${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        await disconnectDatabase();
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

startServer();
