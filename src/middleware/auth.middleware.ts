// src/middleware/auth.middleware.ts
import { Request } from 'express';
import { GraphQLError } from 'graphql';
import { verifyToken } from '../utils/jwt.util';
import User from '../models/User.model';
import { IContext } from '../types/context.type';

/**
 * Extract and verify JWT token from request
 */
export const authenticate = async (req: Request): Promise<any> => {
  // Get token from header
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return null; // No token provided, but don't throw error (allow public queries)
  }

  // Extract token from "Bearer <token>"
  const token = authHeader.split(' ')[1];

  if (!token) {
    throw new GraphQLError('Invalid token format', {
      extensions: { code: 'INVALID_TOKEN' }
    });
  }

  try {
    // Verify token
    const decoded = verifyToken(token);

    // Get user from database
    const user = await User.findById(decoded.id).select('-password');

    if (!user || !user.isActive) {
      throw new GraphQLError('User not found or inactive', {
        extensions: { code: 'UNAUTHORIZED' }
      });
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      employeeRef: user.employeeRef
    };
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      throw new GraphQLError('Invalid token', {
        extensions: { code: 'INVALID_TOKEN' }
      });
    }

    if (error.name === 'TokenExpiredError') {
      throw new GraphQLError('Token expired', {
        extensions: { code: 'TOKEN_EXPIRED' }
      });
    }

    throw error;
  }
};

/**
 * Create GraphQL context with user info
 */
export const createContext = async ({ req }: { req: Request }): Promise<IContext> => {
  const user = await authenticate(req);

  return {
    user,
    req
  };
};

/**
 * Require authentication - throw error if not authenticated
 */
export const requireAuth = (context: IContext) => {
  if (!context.user) {
    throw new GraphQLError('Authentication required', {
      extensions: { code: 'UNAUTHENTICATED' }
    });
  }
  return context.user;
};

/**
 * Require specific role
 */
export const requireRole = (context: IContext, allowedRoles: string[]) => {
  const user = requireAuth(context);

  if (!allowedRoles.includes(user.role)) {
    throw new GraphQLError('Insufficient permissions', {
      extensions: { code: 'FORBIDDEN' }
    });
  }

  return user;
};