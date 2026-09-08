import dotenv from 'dotenv';

dotenv.config();

export const port = Number(process.env.PORT || 5000);
export const mongoUri = process.env.MONGODB_URI;
export const jwtSecret = process.env.JWT_SECRET;
export const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
export const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
export const nodeEnv = process.env.NODE_ENV || 'development';
export const superAdminEmail = (process.env.SUPERADMIN_EMAIL || 'muzamilteamseven00@gmail.com').toLowerCase();

export default {
  port,
  mongoUri,
  jwtSecret,
  jwtExpiresIn,
  clientUrl,
  nodeEnv,
  superAdminEmail,
};
