const dotenv = require('dotenv');
dotenv.config();
module.exports = { port: Number(process.env.PORT || 5000), mongoUri: process.env.MONGODB_URI, jwtSecret: process.env.JWT_SECRET, jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d', clientUrl: process.env.CLIENT_URL || 'http://localhost:5173', superAdminEmail: (process.env.SUPERADMIN_EMAIL || 'muzamilteamseven00@gmail.com').toLowerCase() };
