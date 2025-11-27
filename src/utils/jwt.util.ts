import jwt, { SignOptions, JwtPayload } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '7d') as `${number}${"s" | "m" | "h" | "d" | "w"}`;


export interface TokenPayload {
  id: string;
  email: string;
  role: string;
  employeeRef?: any;
}

/**
 * Generate JWT token
 */
export const generateToken = (payload: TokenPayload): string => {
  const options: SignOptions = {
    expiresIn: JWT_EXPIRES_IN,
  };

  return jwt.sign(payload, JWT_SECRET, options);
};

/**
 * Verify JWT token
 */
export const verifyToken = (token: string): TokenPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // jwt.verify can return string | JwtPayload, we cast safely
    if (typeof decoded === 'string') {
      throw new Error('Invalid token payload');
    }
    return decoded as TokenPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

/**
 * Decode JWT token without verification
 */
export const decodeToken = (token: string): TokenPayload | null => {
  const decoded = jwt.decode(token);
  if (!decoded || typeof decoded === 'string') return null;
  return decoded as TokenPayload;
};
