export interface IEmployeeFilter {
  name?: string;
  email?: string;
  class?: string;
  department?: string;
  ageMin?: number;
  ageMax?: number;
  isActive?: boolean;
  subject?: string;
}

export interface IEmployeeInput {
  name: string;
  email: string;
  age: number;
  class: string;
  subjects: string[];
  salary?: number;
  department?: string;
  joiningDate?: Date;
}

export interface IUpdateEmployeeInput {
  name?: string;
  email?: string;
  age?: number;
  class?: string;
  subjects?: string[];
  salary?: number;
  department?: string;
  isActive?: boolean;
}

export interface IAttendanceInput {
  date: Date;
  status: 'present' | 'absent' | 'late';
  remarks?: string;
}