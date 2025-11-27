// src/models/Employee.model.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IAttendance {
  date: Date;
  status: 'present' | 'absent' | 'late';
  remarks?: string;
}

export interface IEmployee extends Document {
  employeeId: string;
  name: string;
  email: string;
  age: number;
  class: string;
  subjects: string[];
  attendance: IAttendance[];
  joiningDate: Date;
  salary?: number;
  department?: string;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>({
  date: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['present', 'absent', 'late'],
    required: true 
  },
  remarks: { type: String }
}, { _id: false });

const EmployeeSchema = new Schema<IEmployee>(
  {
    employeeId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      index: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    age: {
      type: Number,
      required: [true, 'Age is required'],
      min: [18, 'Age must be at least 18'],
      max: [70, 'Age must not exceed 70']
    },
    class: {
      type: String,
      required: [true, 'Class is required'],
      trim: true
    },
    subjects: {
      type: [String],
      required: [true, 'At least one subject is required'],
      validate: {
        validator: (v: string[]) => v.length > 0,
        message: 'At least one subject must be specified'
      }
    },
    attendance: {
      type: [AttendanceSchema],
      default: []
    },
    joiningDate: {
      type: Date,
      default: Date.now
    },
    salary: {
      type: Number,
      min: [0, 'Salary cannot be negative']
    },
    department: {
      type: String,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for performance
EmployeeSchema.index({ name: 'text', email: 'text' }); // Full-text search
EmployeeSchema.index({ createdAt: -1 }); // Sort by creation date
EmployeeSchema.index({ isActive: 1, name: 1 }); // Compound index

// Virtual for attendance rate
EmployeeSchema.virtual('attendanceRate').get(function () {
  if (this.attendance.length === 0) return 0;
  const presentDays = this.attendance.filter(a => a.status === 'present').length;
  return (presentDays / this.attendance.length) * 100;
});

// Pre-save hook to generate employee ID
EmployeeSchema.pre('save', async function (next) {
  if (this.isNew && !this.employeeId) {
    const count = await mongoose.model('Employee').countDocuments();
    this.employeeId = `EMP${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

export default mongoose.model<IEmployee>('Employee', EmployeeSchema);