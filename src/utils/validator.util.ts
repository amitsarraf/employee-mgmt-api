import Joi from 'joi';

/**
 * Validate email format
 */
export const validateEmail = (email: string): boolean => {
  const schema = Joi.string().email();
  const { error } = schema.validate(email);
  return !error;
};

/**
 * Validate password strength
 */
export const validatePassword = (password: string): {
  valid: boolean;
  message?: string;
} => {
  if (password.length < 6) {
    return { valid: false, message: 'Password must be at least 6 characters' };
  }

  // Add more validation rules as needed
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);

  if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
    return {
      valid: false,
      message: 'Password must contain uppercase, lowercase, and numbers'
    };
  }

  return { valid: true };
};

/**
 * Employee input validation schema
 */
export const employeeInputSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  age: Joi.number().integer().min(18).max(70).required(),
  class: Joi.string().required(),
  subjects: Joi.array().items(Joi.string()).min(1).required(),
  salary: Joi.number().min(0).optional(),
  department: Joi.string().optional(),
  joiningDate: Joi.date().optional()
});

/**
 * User registration validation schema
 */
export const registerInputSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  role: Joi.string().valid('admin', 'employee').optional()
});