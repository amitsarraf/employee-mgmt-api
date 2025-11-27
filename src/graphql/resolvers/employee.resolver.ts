import { GraphQLError } from 'graphql';
import EmployeeService from '../../services/employee.service';
import { IContext } from '../../types/context.type';
import { UserRole } from '../../models/User.model';

const employeeResolver = {
  Query: {
    employees: async (
      _: any,
      { filter, pagination, sort }: any,
      context: IContext
    ) => {
      // Authentication check
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      // Role-based filtering
      let queryFilter = { ...filter };
      if (context.user.role === UserRole.EMPLOYEE && context.user.employeeRef) {
        // Employees can only see their own data
        queryFilter = { _id: context.user.employeeRef };
      }

      const result = await EmployeeService.getEmployees(
        queryFilter,
        pagination,
        sort
      );

      return result;
    },

    employee: async (_: any, { id }: any, context: IContext) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      // Check if employee can only view their own data
      if (
        context.user.role === UserRole.EMPLOYEE &&
        context.user.employeeRef?.toString() !== id
      ) {
        throw new GraphQLError('Not authorized to view this employee', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      const employee = await EmployeeService.getEmployeeById(id);

      if (!employee) {
        throw new GraphQLError('Employee not found', {
          extensions: { code: 'NOT_FOUND' }
        });
      }

      return employee;
    },

    searchEmployees: async (
      _: any,
      { query, pagination }: any,
      context: IContext
    ) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      // Only admins can search all employees
      if (context.user.role !== UserRole.ADMIN) {
        throw new GraphQLError('Not authorized', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      return await EmployeeService.searchEmployees(query, pagination);
    },

    employeeStats: async (_: any, __: any, context: IContext) => {
      if (!context.user || context.user.role !== UserRole.ADMIN) {
        throw new GraphQLError('Admin access required', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      return await EmployeeService.getEmployeeStats();
    }
  },

  Mutation: {
    createEmployee: async (
      _: any,
      { input }: any,
      context: IContext
    ) => {
      // Only admins can create employees
      if (!context.user || context.user.role !== UserRole.ADMIN) {
        throw new GraphQLError('Admin access required', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      const employee = await EmployeeService.createEmployee(
        input,
        context.user.id
      );

      // Publish subscription event (if implemented)
      // context.pubsub.publish('EMPLOYEE_CREATED', { employeeCreated: employee });

      return employee;
    },

    updateEmployee: async (
      _: any,
      { id, input }: any,
      context: IContext
    ) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      // Employees can only update limited fields of their own data
      if (context.user.role === UserRole.EMPLOYEE) {
        if (context.user.employeeRef?.toString() !== id) {
          throw new GraphQLError('Not authorized', {
            extensions: { code: 'FORBIDDEN' }
          });
        }

        // Restrict fields employees can update
        const allowedFields = ['subjects', 'class'];
        const restrictedFields = Object.keys(input).filter(
          key => !allowedFields.includes(key)
        );

        if (restrictedFields.length > 0) {
          throw new GraphQLError(
            `Employees can only update: ${allowedFields.join(', ')}`,
            { extensions: { code: 'FORBIDDEN' } }
          );
        }
      }

      const employee = await EmployeeService.updateEmployee(id, input);

      if (!employee) {
        throw new GraphQLError('Employee not found', {
          extensions: { code: 'NOT_FOUND' }
        });
      }

      return employee;
    },

    deleteEmployee: async (_: any, { id }: any, context: IContext) => {
      // Only admins can delete employees
      if (!context.user || context.user.role !== UserRole.ADMIN) {
        throw new GraphQLError('Admin access required', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      const result = await EmployeeService.deleteEmployee(id);

      if (!result) {
        throw new GraphQLError('Employee not found', {
          extensions: { code: 'NOT_FOUND' }
        });
      }

      return true;
    },

    markAttendance: async (
      _: any,
      { employeeId, attendance }: any,
      context: IContext
    ) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      // Admins can mark for anyone, employees only for themselves
      if (
        context.user.role === UserRole.EMPLOYEE &&
        context.user.employeeRef?.toString() !== employeeId
      ) {
        throw new GraphQLError('Not authorized', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      const employee = await EmployeeService.markAttendance(
        employeeId,
        attendance
      );

      if (!employee) {
        throw new GraphQLError('Employee not found', {
          extensions: { code: 'NOT_FOUND' }
        });
      }

      return employee;
    },

    bulkUpdateEmployees: async (
      _: any,
      { ids, input }: any,
      context: IContext
    ) => {
      if (!context.user || context.user.role !== UserRole.ADMIN) {
        throw new GraphQLError('Admin access required', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      const employees = await EmployeeService.bulkUpdateEmployees(ids, input);
      return employees;
    }
  },

  Employee: {
    // Resolver for createdBy field
    createdBy: async (parent: any, _: any, context: IContext) => {
     if (!context.loaders?.userLoader) {
      throw new Error("userLoader is not available in context");
    }
      // Use DataLoader for efficient batching
      return context?.loaders.userLoader.load(parent.createdBy);
    }
  }
};

export default employeeResolver;