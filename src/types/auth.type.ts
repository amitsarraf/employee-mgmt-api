export interface IRegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'admin' | 'employee';
}

export interface ILoginInput {
  email: string;
  password: string;
}

export interface IAuthPayload {
  token: string;
  user: any;
}

export interface IJWTPayload {
  id: string;
  email: string;
  role: string;
  employeeRef?: string;
  iat?: number;
  exp?: number;
}