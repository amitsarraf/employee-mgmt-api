import employeeResolver from './employee.resolver';
import authResolver from './auth.resolver';

const resolvers = {
  Query: {
    ...employeeResolver.Query,
    ...authResolver.Query
  },
  Mutation: {
    ...employeeResolver.Mutation,
    ...authResolver.Mutation
  },
  Employee: {
    ...employeeResolver.Employee
  }
};

export default resolvers;