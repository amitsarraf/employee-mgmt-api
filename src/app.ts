import express, { Express } from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import typeDefs from './graphql/typeDefs';
import resolvers from './graphql/resolvers';
import { createContext } from './middleware/auth.middleware';
import { logger } from './utils/logger.util';
import { connectDatabase } from './config/database';
import DataLoader from 'dataloader';
import User from './models/User.model';

/**
 * Create and configure Express app with Apollo Server
 */
export async function createApp(): Promise<Express> {
  const app = express();

  // Connect to database
  await connectDatabase();

  // Security middleware
  app.use(
    helmet({
      contentSecurityPolicy: process.env.NODE_ENV === 'production',
      crossOriginEmbedderPolicy: false
    })
  );

  // CORS configuration
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true
    })
  );

  // Compression middleware
  app.use(compression());

  // Rate limiting
  const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    message: 'Too many requests from this IP, please try again later',
    standardHeaders: true,
    legacyHeaders: false
  });

  app.use('/graphql', limiter);

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });

  // Create Apollo Server
  const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
    formatError: (error) => {
      logger.error('GraphQL Error:', {
        message: error.message,
        extensions: error.extensions,
        path: error.path
      });

      return {
        message: error.message,
        extensions: {
          code: error.extensions?.code || 'INTERNAL_SERVER_ERROR',
          ...(process.env.NODE_ENV === 'development' && {
            stacktrace: error.extensions?.stacktrace
          })
        }
      };
    },
    plugins: [
      {
        async requestDidStart() {
          return {
            async didEncounterErrors(requestContext) {
              logger.error('Request errors:', requestContext.errors);
            }
          };
        }
      }
    ]
  });

  await apolloServer.start();

  // DataLoader for batching
  const createLoaders = () => ({
    userLoader: new DataLoader(async (ids: readonly string[]) => {
      const users = await User.find({ _id: { $in: ids } }).select('-password');
      const userMap = new Map(users.map(user => [user.id, user]));
      return ids.map(id => userMap.get(id) || null);
    })
  });

  // Apply Apollo middleware
  app.use(
    '/graphql',
    expressMiddleware(apolloServer, {
      context: async ({ req }) => {
        const context = await createContext({ req });
        return {
          ...context,
          loaders: createLoaders()
        };
      }
    })
  );

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });

  // Error handler
  app.use((err: any, req: any, res: any, next: any) => {
    logger.error('Server error:', err);
    res.status(err.status || 500).json({
      error: err.message || 'Internal server error'
    });
  });

  return app;
}