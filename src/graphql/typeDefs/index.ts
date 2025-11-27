import { gql } from 'graphql-tag';

export const typeDefs = gql`
  # Enums
  enum Role {
    ADMIN
    EMPLOYEE
  }

  enum AttendanceStatus {
    PRESENT
    ABSENT
    LATE
  }

  enum SortOrder {
    ASC
    DESC
  }

  # Common Types
  type Attendance {
    date: String!
    status: AttendanceStatus!
    remarks: String
  }

  type PaginationInfo {
    total: Int!
    page: Int!
    limit: Int!
    pages: Int!
    hasNextPage: Boolean!
    hasPrevPage: Boolean!
  }

  # Employee Types
  type Employee {
    id: ID!
    employeeId: String!
    name: String!
    email: String!
    age: Int!
    class: String!
    subjects: [String!]!
    attendance: [Attendance!]!
    joiningDate: String!
    salary: Float
    department: String
    isActive: Boolean!
    attendanceRate: Float!
    createdBy: User!
    createdAt: String!
    updatedAt: String!
  }

  type EmployeeConnection {
    data: [Employee!]!
    pagination: PaginationInfo!
  }

  # User Types
  type User {
    id: ID!
    email: String!
    role: Role!
    firstName: String!
    lastName: String!
    fullName: String!
    isActive: Boolean!
    lastLogin: String
    employeeRef: Employee
    createdAt: String!
    updatedAt: String!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  # Input Types
  input RegisterInput {
    email: String!
    password: String!
    firstName: String!
    lastName: String!
    role: Role
  }

  input CreateEmployeeInput {
    name: String!
    email: String!
    age: Int!
    class: String!
    subjects: [String!]!
    salary: Float
    department: String
    joiningDate: String
  }

  input UpdateEmployeeInput {
    name: String
    email: String
    age: Int
    class: String
    subjects: [String!]
    salary: Float
    department: String
    isActive: Boolean
  }

  input EmployeeFilterInput {
    name: String
    email: String
    class: String
    department: String
    ageMin: Int
    ageMax: Int
    isActive: Boolean
    subject: String
  }

  input PaginationInput {
    page: Int = 1
    limit: Int = 10
  }

  input SortInput {
    field: String = "createdAt"
    order: SortOrder = DESC
  }

  input AttendanceInput {
    date: String!
    status: AttendanceStatus!
    remarks: String
  }

  # Queries
  type Query {
    # Auth
    me: User!

    # Employees
    employees(
      filter: EmployeeFilterInput
      pagination: PaginationInput
      sort: SortInput
    ): EmployeeConnection!
    
    employee(id: ID!): Employee!
    
    searchEmployees(
      query: String!
      pagination: PaginationInput
    ): EmployeeConnection!

    # Statistics (Admin only)
    employeeStats: EmployeeStats!
  }

  # Mutations
  type Mutation {
    # Auth
    register(input: RegisterInput!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!

    # Employee Management
    createEmployee(input: CreateEmployeeInput!): Employee!
    updateEmployee(id: ID!, input: UpdateEmployeeInput!): Employee!
    deleteEmployee(id: ID!): Boolean!

    # Attendance
    markAttendance(
      employeeId: ID!
      attendance: AttendanceInput!
    ): Employee!

    # Bulk Operations (Admin only)
    bulkUpdateEmployees(
      ids: [ID!]!
      input: UpdateEmployeeInput!
    ): [Employee!]!
  }

  # Subscriptions (Optional - for real-time updates)
  type Subscription {
    employeeCreated: Employee!
    employeeUpdated(id: ID!): Employee!
    attendanceMarked: Employee!
  }

  # Statistics Type
  type EmployeeStats {
    totalEmployees: Int!
    activeEmployees: Int!
    inactiveEmployees: Int!
    averageAge: Float!
    departmentCounts: [DepartmentCount!]!
    averageAttendanceRate: Float!
  }

  type DepartmentCount {
    department: String!
    count: Int!
  }
`;

export default typeDefs;