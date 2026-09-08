import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { jwtSecret, jwtExpiresIn, superAdminEmail, clientUrl } from '../config/env.js';
import { sendPasswordResetEmail } from '../services/email.js';

export const safe = (u) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  role: u.role,
  status: u.status,
});

export function token(u) {
  return jwt.sign({ sub: u._id.toString(), role: u.role }, jwtSecret, { expiresIn: jwtExpiresIn });
}

export async function signup(req, res) {
  const { name, email, password } = req.body;
  if (!name || !email || !password || password.length < 8) {
    return res.status(400).json({ message: 'Name, email and password (8+ chars) are required' });
  }
  const normalized = email.toLowerCase().trim();
  const existing = await User.findOne({ email: normalized });
  if (existing) {
    return res.status(409).json({ message: 'Email already registered' });
  }
  const role = normalized === superAdminEmail ? 'SUPER_ADMIN' : 'USER';
  const passwordHash = await bcrypt.hash(password, 12);
  const u = await User.create({ name, email: normalized, passwordHash, role });
  return res.status(201).json({ token: token(u), user: safe(u) });
}

export async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  const u = await User.findOne({ email: email.toLowerCase().trim() });
  if (!u || !(await bcrypt.compare(password, u.passwordHash))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }
  if (u.status !== 'ACTIVE') {
    return res.status(403).json({ message: 'Account disabled' });
  }
  if (u.email === superAdminEmail && u.role !== 'SUPER_ADMIN') {
    u.role = 'SUPER_ADMIN';
    await u.save();
  }
  return res.json({ token: token(u), user: safe(u) });
}

export async function me(req, res) {
  return res.json({ user: safe(req.user) });
}

/**
 * Request Password Reset (Forgot Password)
 * Generates secure token, stores sha256 hash in DB, and dispatches reset email
 */
export async function forgotPassword(req, res) {
  const { email } = req.body;
  if (!email || !email.trim()) {
    return res.status(400).json({ message: 'Email address is required' });
  }

  const normalized = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalized, status: 'ACTIVE' });

  // For security, do not reveal if user exists or not
  if (!user) {
    return res.json({
      message: 'If an account exists with this email, a password reset link has been sent.',
    });
  }

  // Generate 32-byte secure random token
  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

  // Token valid for 1 hour
  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
  await user.save();

  // Create clean reset link
  const cleanClientUrl = clientUrl.replace(/\/$/, '');
  const resetUrl = `${cleanClientUrl}/reset-password/${rawToken}`;

  await sendPasswordResetEmail({
    to: user.email,
    name: user.name,
    resetUrl,
  });

  return res.json({
    message: 'A password reset link has been sent to your email address.',
  });
}

/**
 * Reset Password with Token
 * Validates token, enforces strict password rules, and verifies new password != current password
 */
export async function resetPassword(req, res) {
  const { token: paramToken } = req.params;
  const { token: bodyToken, newPassword, confirmPassword } = req.body;

  const rawToken = paramToken || bodyToken;
  if (!rawToken || !rawToken.trim()) {
    return res.status(400).json({ message: 'Password reset token is missing' });
  }

  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ message: 'New password must be at least 8 characters long' });
  }

  if (confirmPassword && newPassword !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }

  // Hash incoming raw token to query DB
  const hashedToken = crypto.createHash('sha256').update(rawToken.trim()).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: new Date() },
  });

  if (!user) {
    return res.status(400).json({
      message: 'Password reset token is invalid or has expired. Please request a new link.',
    });
  }

  // CRITICAL REQUIREMENT: Check against current password
  // If user tries to set the same password as current password, return error
  const isSamePassword = await bcrypt.compare(newPassword, user.passwordHash);
  if (isSamePassword) {
    return res.status(400).json({
      message: 'New password cannot be the same as your current password. Please choose a different password.',
    });
  }

  // Update password and clear reset token fields
  user.passwordHash = await bcrypt.hash(newPassword, 12);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  return res.json({
    message: 'Password has been reset successfully. You can now log in with your new password.',
  });
}

export default {
  signup,
  login,
  me,
  forgotPassword,
  resetPassword,
  safe,
  token,
};
