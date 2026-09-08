import express from 'express';
import { auth, requireSuperAdmin } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { signup, login, me } from '../controllers/auth.js';
import * as c from '../controllers/finance.js';
import asyncH from '../utils/async.js';

const r = express.Router();

// Auth routes (with brute-force protection rate limiting)
r.post('/auth/signup', authLimiter, asyncH(signup));
r.post('/auth/login', authLimiter, asyncH(login));
r.get('/auth/me', auth, asyncH(me));

// Dashboard route
r.get('/dashboard', auth, asyncH(c.dashboard));

// Vehicles routes (with pagination & deep tracking)
r.get('/vehicles', auth, asyncH(c.vehicles));
r.post('/vehicles', auth, asyncH(c.vehicles));
r.put('/vehicles/:id', auth, asyncH(c.vehicleUpdate));
r.delete('/vehicles/:id', auth, asyncH(c.vehicleDelete));

// Transactions / Home Finance routes (with pagination)
r.get('/transactions', auth, asyncH(c.transactions));
r.post('/transactions', auth, asyncH(c.transactions));
r.put('/transactions/:id', auth, asyncH(c.transactionUpdate));
r.delete('/transactions/:id', auth, asyncH(c.transactionDelete));

// Len Den / Shared & External Udhaar routes (with pagination)
r.get('/lend', auth, asyncH(c.lends));
r.post('/lend', auth, asyncH(c.lends));
r.patch('/lend/:id/status', auth, asyncH(c.lendAction));
r.delete('/lend/:id', auth, asyncH(c.lendDelete));

// Search & Admin routes
r.get('/users/search', auth, asyncH(c.searchUsers));
r.get('/admin/users', auth, requireSuperAdmin, asyncH(c.users));
r.patch('/admin/users/:id/status', auth, requireSuperAdmin, asyncH(c.toggleUserStatus));
r.delete('/admin/users/:id', auth, requireSuperAdmin, asyncH(c.deleteUser));

export default r;
