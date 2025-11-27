import { GraphQLError } from 'graphql';
import User, { IUser, UserRole } from '../models/User.model';
import { generateToken } from '../utils/jwt.util';

class AuthService {
  /**
   * Register a new user
   */
  async register(input: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: UserRole;
  }): Promise<{ token: string; user: IUser }> {
    const { email, password, firstName, lastName, role = UserRole.EMPLOYEE } = input;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new GraphQLError('User with this email already exists', {
        extensions: { code: 'USER_EXISTS' }
      });
    }

    // Validate password strength
    if (password.length < 6) {
      throw new GraphQLError('Password must be at least 6 characters', {
        extensions: { code: 'INVALID_PASSWORD' }
      });
    }

    // Create new user
    const user = new User({
      email,
      password, // Will be hashed by pre-save hook
      firstName,
      lastName,
      role,
      isActive: true
    });

    await user.save();

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    return { token, user };
  }

  /**
   * Login user
   */
  async login(
    email: string,
    password: string
  ): Promise<{ token: string; user: IUser }> {
    // Find user and include password field
    const user = await User.findOne({ email, isActive: true })
      .select('+password')
      .populate('employeeRef');

    if (!user) {
      throw new GraphQLError('Invalid email or password', {
        extensions: { code: 'INVALID_CREDENTIALS' }
      });
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new GraphQLError('Invalid email or password', {
        extensions: { code: 'INVALID_CREDENTIALS' }
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      employeeRef: user.employeeRef
    });

    // Remove password from response
    const userObject = user.toObject();
    delete (userObject as any) .password;

    return { token, user: userObject };
  }

  /**
   * Get current user
   */
  async getCurrentUser(userId: string): Promise<IUser | null> {
    const user = await User.findById(userId)
      .populate('employeeRef')
      .exec();

    if (!user || !user.isActive) {
      throw new GraphQLError('User not found or inactive', {
        extensions: { code: 'USER_NOT_FOUND' }
      });
    }

    return user;
  }

  /**
   * Verify user token and return user data
   */
  async verifyUser(userId: string): Promise<IUser | null> {
    return User.findById(userId).select('-password').exec();
  }
}

export default new AuthService();