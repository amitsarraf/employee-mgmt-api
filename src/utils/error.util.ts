import { GraphQLError } from 'graphql';

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export const handleError = (error: any): GraphQLError => {
  if (error instanceof GraphQLError) {
    return error;
  }

  if (error instanceof AppError) {
    return new GraphQLError(error.message, {
      extensions: { code: error.code }
    });
  }

  // MongoDB duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    return new GraphQLError(`${field} already exists`, {
      extensions: { code: 'DUPLICATE_KEY' }
    });
  }

  // MongoDB validation error
  if (error.name === 'ValidationError') {
    const messages = Object.values(error.errors).map((err: any) => err.message);
    return new GraphQLError(messages.join(', '), {
      extensions: { code: 'VALIDATION_ERROR' }
    });
  }

  // Default error
  return new GraphQLError('Internal server error', {
    extensions: { code: 'INTERNAL_SERVER_ERROR' }
  });
};