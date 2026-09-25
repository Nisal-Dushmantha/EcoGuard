import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User, { UserRole } from '../../../models/User.model.js';
import { AuthenticatedRequest, AuthUserPayload } from '../../../middlewares/auth.middleware.js';

const getJwtSecret = (): string => {
  return process.env.JWT_SECRET || 'ecoguard_jwt_secret_key_2026_university_project';
};

// Fallback in-memory store if MongoDB is offline or IP whitelisting is pending
interface LocalUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  assignedPark: string;
}

const mockUsers: LocalUser[] = [
  {
    id: 'demo-pm-01',
    name: 'Nisal Dushmantha',
    email: 'manager@ecoguard.lk',
    passwordHash: bcrypt.hashSync('password123', 10),
    role: 'Park Manager',
    assignedPark: 'Yala National Park',
  },
  {
    id: 'demo-cr-02',
    name: 'Dr. Senanayake',
    email: 'researcher@ecoguard.lk',
    passwordHash: bcrypt.hashSync('password123', 10),
    role: 'Conservation Researcher',
    assignedPark: 'Wilpattu National Park',
  },
  {
    id: 'demo-adm-03',
    name: 'Central Admin',
    email: 'admin@ecoguard.lk',
    passwordHash: bcrypt.hashSync('password123', 10),
    role: 'Admin',
    assignedPark: 'All Parks',
  },
];

const generateToken = (payload: AuthUserPayload): string => {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '7d' });
};

/**
 * @route   POST /api/webapp/auth/register
 * @desc    Register a new user for the Web App
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role, assignedPark } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: 'Name, email, and password are required.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const validRole: UserRole = ['Park Manager', 'Conservation Researcher', 'Ranger', 'Admin'].includes(role)
      ? role
      : 'Park Manager';

    const park = assignedPark || 'Yala National Park';

    // If MongoDB is connected, use DB
    if (mongoose.connection.readyState === 1) {
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) {
        res.status(400).json({ error: 'An account with this email already exists.' });
        return;
      }

      const user = await User.create({
        name,
        email: normalizedEmail,
        password,
        role: validRole,
        assignedPark: park,
      });

      const payload: AuthUserPayload = {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        assignedPark: user.assignedPark,
      };

      const token = generateToken(payload);

      res.status(201).json({
        message: 'Registration successful',
        token,
        user: payload,
      });
      return;
    }

    // Fallback in-memory registration
    const existingMock = mockUsers.find((u) => u.email === normalizedEmail);
    if (existingMock) {
      res.status(400).json({ error: 'An account with this email already exists.' });
      return;
    }

    const newLocalUser: LocalUser = {
      id: `local-${Date.now()}`,
      name,
      email: normalizedEmail,
      passwordHash: await bcrypt.hash(password, 10),
      role: validRole,
      assignedPark: park,
    };
    mockUsers.push(newLocalUser);

    const payload: AuthUserPayload = {
      id: newLocalUser.id,
      name: newLocalUser.name,
      email: newLocalUser.email,
      role: newLocalUser.role,
      assignedPark: newLocalUser.assignedPark,
    };

    const token = generateToken(payload);

    res.status(201).json({
      message: 'Registration successful (offline storage)',
      token,
      user: payload,
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error?.message || 'Server error during registration.' });
  }
};

/**
 * @route   POST /api/webapp/auth/login
 * @desc    Login existing user with credentials
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Please provide both email and password.' });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 1. If MongoDB is connected, search database
    if (mongoose.connection.readyState === 1) {
      const user = await User.findOne({ email: normalizedEmail });
      if (user) {
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
          res.status(401).json({ error: 'Invalid email or password.' });
          return;
        }

        const payload: AuthUserPayload = {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          assignedPark: user.assignedPark,
        };

        const token = generateToken(payload);

        res.status(200).json({
          message: 'Login successful',
          token,
          user: payload,
        });
        return;
      }
    }

    // 2. Check local fallback mock users (handles demo accounts or offline development)
    const localUser = mockUsers.find((u) => u.email === normalizedEmail);
    if (localUser) {
      const isMatch = await bcrypt.compare(password, localUser.passwordHash);
      if (!isMatch) {
        res.status(401).json({ error: 'Invalid email or password.' });
        return;
      }

      const payload: AuthUserPayload = {
        id: localUser.id,
        name: localUser.name,
        email: localUser.email,
        role: localUser.role,
        assignedPark: localUser.assignedPark,
      };

      const token = generateToken(payload);

      res.status(200).json({
        message: 'Login successful',
        token,
        user: payload,
      });
      return;
    }

    res.status(401).json({ error: 'Invalid email or password.' });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: error?.message || 'Server error during login.' });
  }
};

/**
 * @route   GET /api/webapp/auth/me
 * @desc    Get currently logged in user details
 */
export const getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated.' });
    return;
  }

  res.status(200).json({
    user: req.user,
  });
};
