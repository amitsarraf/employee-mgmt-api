import dotenv from 'dotenv';
import { createApp } from './app';
import { logger } from './utils/logger.util';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 4000;


async function startServer() {
  try {
    const app = await createApp();

    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server ready at http://localhost:${PORT}/graphql`);
      logger.info(`📊 Health check at http://localhost:${PORT}/health`);
      logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully...`);

      server.close(async () => {
        logger.info('HTTP server closed');

        // Close database connection
        const mongoose = require('mongoose');
        await mongoose.connection.close();
        logger.info('Database connection closed');

        // Close Redis connection
        const CacheService = require('./services/cache.service').default;
        await CacheService.close();

        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();