# Employee Management GraphQL API

A production-ready GraphQL API built with Node.js, TypeScript, MongoDB, and Redis for managing employee data with role-based access control, caching, and performance optimizations.

## 🚀 Features

### Core Functionality
- ✅ **GraphQL API** with Apollo Server
- ✅ **MongoDB** for data persistence with Mongoose ODM
- ✅ **Redis** for caching and performance
- ✅ **JWT Authentication** with role-based access control
- ✅ **Pagination & Sorting** for all list queries
- ✅ **Full-text search** capabilities
- ✅ **DataLoader** for efficient data fetching
- ✅ **Rate limiting** to prevent API abuse
- ✅ **Request logging** with Winston
- ✅ **Input validation** with Joi

### Security
- 🔒 Password hashing with bcrypt
- 🔒 JWT token-based authentication
- 🔒 Role-based authorization (Admin & Employee)
- 🔒 Helmet.js for security headers
- 🔒 Rate limiting middleware
- 🔒 CORS configuration

### Performance Optimizations
- ⚡ Redis caching for frequently accessed data
- ⚡ DataLoader for batching and caching
- ⚡ MongoDB indexes on key fields
- ⚡ Connection pooling
- ⚡ Lean queries for read operations
- ⚡ Response compression

## 📦 Installation

```bash
# Clone the repository
git clone <repository-url>
cd employee-management-api

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Update .env with your configurations
```

## 🔧 Environment Variables

```env
# Server
NODE_ENV=development
PORT=4000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/employee_management

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGIN=*
```

## 🏃 Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

### Run Tests
```bash
npm test
```

## 📡 API Endpoints

- **GraphQL Playground**: `http://localhost:4000/graphql`
- **Health Check**: `http://localhost:4000/health`

## 🔐 Authentication

### Register a User
```graphql
mutation {
  register(input: {
    email: "admin@example.com"
    password: "Admin@123"
    firstName: "John"
    lastName: "Doe"
    role: ADMIN
  }) {
    token
    user {
      id
      email
      role
      fullName
    }
  }
}
```

### Login
```graphql
mutation {
  login(
    email: "admin@example.com"
    password: "Admin@123"
  ) {
    token
    user {
      id
      email
      role
      fullName
    }
  }
}
```

### Get Current User
```graphql
query {
  me {
    id
    email
    role
    fullName
    employeeRef {
      id
      name
      employeeId
    }
  }
}
```

**Note**: Add the token to HTTP headers for authenticated requests:
```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

## 👥 Employee Management

### Create Employee (Admin Only)
```graphql
mutation {
  createEmployee(input: {
    name: "Jane Smith"
    email: "jane.smith@example.com"
    age: 28
    class: "Grade 10"
    subjects: ["Mathematics", "Physics", "Chemistry"]
    salary: 45000
    department: "Science"
  }) {
    id
    employeeId
    name
    email
    age
    class
    subjects
    department
    createdAt
  }
}
```

### Get All Employees with Filters
```graphql
query {
  employees(
    filter: {
      department: "Science"
      ageMin: 25
      ageMax: 40
      isActive: true
    }
    pagination: {
      page: 1
      limit: 10
    }
    sort: {
      field: "name"
      order: ASC
    }
  ) {
    data {
      id
      employeeId
      name
      email
      age
      class
      subjects
      department
      salary
      joiningDate
      attendanceRate
    }
    pagination {
      total
      page
      limit
      pages
      hasNextPage
      hasPrevPage
    }
  }
}
```

### Get Single Employee
```graphql
query {
  employee(id: "64abc123def456789") {
    id
    employeeId
    name
    email
    age
    class
    subjects
    department
    salary
    joiningDate
    attendance {
      date
      status
      remarks
    }
    attendanceRate
    createdBy {
      fullName
      email
    }
  }
}
```

### Update Employee
```graphql
mutation {
  updateEmployee(
    id: "64abc123def456789"
    input: {
      age: 29
      salary: 48000
      subjects: ["Mathematics", "Physics", "Chemistry", "Biology"]
    }
  ) {
    id
    name
    age
    salary
    subjects
    updatedAt
  }
}
```

### Delete Employee (Admin Only)
```graphql
mutation {
  deleteEmployee(id: "64abc123def456789")
}
```

### Search Employees
```graphql
query {
  searchEmployees(
    query: "john mathematics"
    pagination: { page: 1, limit: 10 }
  ) {
    data {
      id
      name
      email
      subjects
    }
    pagination {
      total
    }
  }
}
```

## 📅 Attendance Management

### Mark Attendance
```graphql
mutation {
  markAttendance(
    employeeId: "64abc123def456789"
    attendance: {
      date: "2024-01-15"
      status: PRESENT
      remarks: "On time"
    }
  ) {
    id
    name
    attendance {
      date
      status
      remarks
    }
    attendanceRate
  }
}
```

## 📊 Statistics (Admin Only)

```graphql
query {
  employeeStats {
    totalEmployees
    activeEmployees
    inactiveEmployees
    averageAge
    averageAttendanceRate
    departmentCounts {
      department
      count
    }
  }
}
```

## 🔄 Bulk Operations (Admin Only)

```graphql
mutation {
  bulkUpdateEmployees(
    ids: ["64abc123def456789", "64xyz789abc123456"]
    input: {
      isActive: false
    }
  ) {
    id
    name
    isActive
  }
}
```

## 🎯 Role-Based Access Control

### Admin Role
- ✅ Full CRUD operations on all employees
- ✅ View all employee data
- ✅ Manage attendance for all employees
- ✅ Access statistics and reports
- ✅ Bulk operations

### Employee Role
- ✅ View own profile
- ✅ Update limited fields (subjects, class)
- ✅ View own attendance
- ❌ Cannot create, delete, or view other employees
- ❌ Cannot access statistics

## 🏗️ Project Structure

```
src/
├── config/              # Configuration files
│   ├── database.ts      # MongoDB setup
│   ├── redis.ts         # Redis configuration
│   └── environment.ts   # Environment variables
├── models/              # Mongoose models
│   ├── Employee.model.ts
│   └── User.model.ts
├── graphql/             # GraphQL layer
│   ├── typeDefs/        # Type definitions
│   ├── resolvers/       # Resolvers
│   └── schema.ts        # Combined schema
├── services/            # Business logic
│   ├── employee.service.ts
│   ├── auth.service.ts
│   └── cache.service.ts
├── middleware/          # Express middleware
│   └── auth.middleware.ts
├── utils/               # Utility functions
│   ├── jwt.util.ts
│   ├── logger.util.ts
│   └── validator.util.ts
├── types/               # TypeScript types
│   └── context.type.ts
├── app.ts               # Express + Apollo setup
└── server.ts            # Entry point
```

## 🧪 Testing

Run the test suite:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## 📈 Performance Considerations

### 1. **Database Indexing**
- Indexed fields: `email`, `name`, `employeeId`, `isActive`
- Compound indexes for common query patterns
- Full-text search index on `name` and `email`

### 2. **Caching Strategy**
- Employee lists cached for 5 minutes
- Single employee data cached for 5 minutes
- Cache invalidation on updates/deletes
- Pattern-based cache deletion for list queries

### 3. **DataLoader**
- Batches and caches `createdBy` user lookups
- Prevents N+1 query problems

### 4. **Query Optimization**
- Use `.lean()` for read-only operations
- Selective field population
- Pagination to limit result sets
- Connection pooling (10 max, 5 min)

### 5. **Rate Limiting**
- 100 requests per 15 minutes per IP
- Configurable via environment variables

## 🛡️ Security Best Practices

1. **Environment Variables**: Never commit `.env` files
2. **JWT Secret**: Use strong, random secrets in production
3. **Password Policy**: Enforce strong passwords
4. **CORS**: Configure allowed origins in production
5. **Helmet**: Security headers enabled
6. **Input Validation**: All inputs validated with Joi
7. **Rate Limiting**: Prevents brute force attacks

## 🔧 Troubleshooting

### MongoDB Connection Issues
```bash
# Check if MongoDB is running
mongod --version

# Start MongoDB
mongod
```

### Redis Connection Issues
```bash
# Check if Redis is running
redis-cli ping

# Start Redis
redis-server
```

### Port Already in Use
```bash
# Change PORT in .env file
PORT=5000
```

## 📝 Sample Data

Create a seed script to populate initial data:

```typescript
// scripts/seed.ts
import mongoose from 'mongoose';
import User from './src/models/User.model';
import Employee from './src/models/Employee.model';

async function seed() {
  await mongoose.connect('mongodb://localhost:27017/employee_management');
  
  // Create admin user
  const admin = await User.create({
    email: 'admin@example.com',
    password: 'Admin@123',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin'
  });

  // Create sample employees
  await Employee.create([
    {
      name: 'John Doe',
      email: 'john@example.com',
      age: 30,
      class: 'Grade 10',
      subjects: ['Math', 'Physics'],
      department: 'Science',
      salary: 50000,
      createdBy: admin._id
    }
  ]);

  console.log('Seeding complete!');
  process.exit(0);
}

seed();
```

## 📚 Additional Resources

- [GraphQL Documentation](https://graphql.org/)
- [Apollo Server Docs](https://www.apollographql.com/docs/apollo-server/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [Redis Documentation](https://redis.io/docs/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

MIT License - feel free to use this project for learning or commercial purposes.

---

**Built with ❤️ using Node.js, TypeScript, GraphQL, MongoDB, and Redis**