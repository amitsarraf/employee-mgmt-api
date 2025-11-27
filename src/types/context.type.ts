import { Request } from 'express';
import DataLoader from 'dataloader';
import { IUser } from '../models/User.model';

export interface IContext {
  user: {
    id: string;
    email: string;
    role: string;
    employeeRef?: any;
  } | null;
  req: Request;
  loaders?: {
    userLoader: DataLoader<string, any>;
  };
}
