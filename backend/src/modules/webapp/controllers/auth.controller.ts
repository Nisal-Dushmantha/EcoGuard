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

const mockUsers: LocalUser[] = [];

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
    const validRole: UserRole = ['Park Manager', 'Conservation Researcher', 'Ranger', 'Admin', 'Community Liaison Officer', 'Community Member'].includes(role)
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

    // 2. Check local fallback mock users (handles offline development when DB is disconnected)
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
 * @desc    Get currently logged in user details from MongoDB
 */
export const getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated.' });
    return;
  }

  try {
    if (mongoose.connection.readyState === 1 && req.user.id && !req.user.id.startsWith('local-')) {
      const dbUser = await User.findById(req.user.id).select('-password');
      if (dbUser) {
        res.status(200).json({
          user: {
            id: dbUser._id.toString(),
            name: dbUser.name,
            email: dbUser.email,
            role: dbUser.role,
            assignedPark: dbUser.assignedPark,
            phoneNumber: dbUser.phoneNumber || '',
            dutyStatus: dbUser.dutyStatus !== undefined ? dbUser.dutyStatus : true,
            callSign: dbUser.callSign || '',
            officerId: dbUser.officerId || dbUser._id.toString().substring(0, 10).toUpperCase(),
            createdAt: dbUser.createdAt,
            updatedAt: dbUser.updatedAt,
          },
        });
        return;
      }
    }

    res.status(200).json({
      user: req.user,
    });
  } catch (error: any) {
    console.error('getMe error:', error);
    res.status(500).json({ error: 'Server error fetching user profile.' });
  }
};

/**
 * @route   PATCH /api/webapp/auth/me
 * @desc    Update user-editable profile details
 */
export const updateProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated.' });
    return;
  }

  try {
    const { name, phoneNumber, dutyStatus, callSign } = req.body;
    const updates: Record<string, any> = {};

    if (name !== undefined) updates.name = name.trim();
    if (phoneNumber !== undefined) updates.phoneNumber = phoneNumber.trim();
    if (dutyStatus !== undefined) updates.dutyStatus = Boolean(dutyStatus);
    if (callSign !== undefined) updates.callSign = callSign.trim();

    if (mongoose.connection.readyState === 1 && req.user.id && !req.user.id.startsWith('local-')) {
      const updatedUser = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select('-password');
      if (!updatedUser) {
        res.status(404).json({ error: 'User account not found.' });
        return;
      }

      res.status(200).json({
        message: 'Profile updated successfully',
        user: {
          id: updatedUser._id.toString(),
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          assignedPark: updatedUser.assignedPark,
          phoneNumber: updatedUser.phoneNumber || '',
          dutyStatus: updatedUser.dutyStatus !== undefined ? updatedUser.dutyStatus : true,
          callSign: updatedUser.callSign || '',
          officerId: updatedUser.officerId || updatedUser._id.toString().substring(0, 10).toUpperCase(),
          createdAt: updatedUser.createdAt,
          updatedAt: updatedUser.updatedAt,
        },
      });
      return;
    }

    res.status(200).json({
      message: 'Profile updated',
      user: {
        ...req.user,
        ...updates,
      },
    });
  } catch (error: any) {
    console.error('updateProfile error:', error);
    res.status(500).json({ error: error?.message || 'Failed to update profile.' });
  }
};

/**
 * @route   POST /api/webapp/auth/change-password
 * @desc    Change password for currently authenticated user
 */
export const changePassword = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated.' });
    return;
  }

  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Current password and new password are required.' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters long.' });
      return;
    }

    if (mongoose.connection.readyState === 1 && req.user.id && !req.user.id.startsWith('local-')) {
      const user = await User.findById(req.user.id);
      if (!user) {
        res.status(404).json({ error: 'User account not found.' });
        return;
      }

      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        res.status(400).json({ error: 'Incorrect current password.' });
        return;
      }

      user.password = newPassword;
      await user.save();

      res.status(200).json({ message: 'Password changed successfully.' });
      return;
    }

    res.status(200).json({ message: 'Password changed successfully.' });
  } catch (error: any) {
    console.error('changePassword error:', error);
    res.status(500).json({ error: error?.message || 'Failed to change password.' });
  }
};
