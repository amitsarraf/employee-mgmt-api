import mongoose from 'mongoose';
import User from '../../src/models/User.model';
import Employee from '../../src/models/Employee.model';

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

seed()