import { GraphQLError } from 'graphql';
import AuthService from '../../services/auth.service';
import { IContext } from '../../types/context.type';

const authResolver = {
  Query: {
    me: async (_: any, __: any, context: IContext) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      const user = await AuthService.getCurrentUser(context.user.id);

      if (!user) {
        throw new GraphQLError('User not found', {
          extensions: { code: 'USER_NOT_FOUND' }
        });
      }

      return user;
    }
  },

  Mutation: {
    register: async (_: any, { input }: any) => {
      try {
        const result = await AuthService.register(input);
        return result;
      } catch (error: any) {
        throw new GraphQLError(error.message, {
          extensions: { code: error.extensions?.code || 'REGISTRATION_ERROR' }
        });
      }
    },

    login: async (_: any, { email, password }: any) => {
      try {
        const result = await AuthService.login(email, password);
        return result;
      } catch (error: any) {
        throw new GraphQLError(error.message, {
          extensions: { code: error.extensions?.code || 'LOGIN_ERROR' }
        });
      }
    }
  }
};

export default authResolver;