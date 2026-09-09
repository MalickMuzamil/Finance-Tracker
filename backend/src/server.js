import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import connectDB from './config/db.js';
import { port, clientUrl, nodeEnv } from './config/env.js';
import routes from './routes/index.js';
import errorHandler from './middleware/error.js';
import { apiLimiter } from './middleware/rateLimiter.js';

const app = express();

// Trust reverse proxy in production (Render, Railway, Heroku, Nginx, Cloudflare, etc.)
app.set('trust proxy', 1);

// Helmet security headers configured to allow cross-origin API consumption
app.use(
    helmet({
        crossOriginResourcePolicy: { policy: 'cross-origin' },
        crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    })
);

// Robust CORS configuration supporting single or multiple origins (comma-separated),
// wildcard support, and local dev environments
const parseOrigins = (rawOrigins) => {
    if (!rawOrigins) return [];
    return rawOrigins
        .split(',')
        .map((origin) => origin.trim().replace(/\/$/, ''))
        .filter(Boolean);
};

const configuredOrigins = parseOrigins(clientUrl);
const defaultLocalOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:4173',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:4173',
];

const allowedOrigins = Array.from(new Set([...configuredOrigins, ...defaultLocalOrigins]));

const corsOptions = {
    origin: (origin, callback) => {
        // Allow non-browser requests (e.g. mobile apps, curl, server-to-server, Postman)
        if (!origin) return callback(null, true);

        // If wildcard '*' is in configured origins or non-production environment
        if (allowedOrigins.includes('*')) {
            return callback(null, true);
        }

        // Direct match check
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        // Allow dev localhost requests in non-production
        if (nodeEnv !== 'production' && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
            return callback(null, true);
        }

        // Automatically allow any Vercel preview or production deployments
        if (origin.endsWith('.vercel.app') || origin.includes('vercel.app')) {
            return callback(null, true);
        }

        // Check wildcard subdomain matches (e.g. *.example.com or https://*.vercel.app)
        const cleanOrigin = origin.replace(/^https?:\/\//, '').toLowerCase();
        const isMatched = allowedOrigins.some((allowed) => {
            const cleanAllowed = allowed.replace(/^https?:\/\//, '').toLowerCase();
            if (cleanAllowed.startsWith('*.')) {
                const domain = cleanAllowed.slice(2);
                return cleanOrigin.endsWith(domain);
            }
            return cleanOrigin === cleanAllowed;
        });

        if (isMatched) {
            return callback(null, true);
        }

        // Return false instead of throwing an Error so express-cors gracefully rejects without crashing preflights
        return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    exposedHeaders: ['Set-Cookie'],
    maxAge: 86400, // 24 hours preflight cache
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Safe preflight handler for OPTIONS requests
app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
        const reqOrigin = req.headers.origin;
        if (reqOrigin) {
            res.header('Access-Control-Allow-Origin', reqOrigin);
            res.header('Access-Control-Allow-Credentials', 'true');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
        }
        return res.sendStatus(204);
    }
    next();
});

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (nodeEnv !== 'test') {
    app.use(morgan(nodeEnv === 'production' ? 'combined' : 'dev'));
}

// Health check endpoints
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        environment: nodeEnv,
    });
});

// Apply dynamic role-based rate limiter to all API endpoints
app.use('/api', apiLimiter);

// Mount routes
app.use('/api', routes);

// 404 Handler for undefined API routes
app.use((req, res) => {
  res.status(404).json({ message: `Route '${req.originalUrl}' not found.` });
});

// Global error handler
app.use(errorHandler);

// Start server after DB connection
connectDB()
    .then(async () => {
        // Automatically seed default categories if not already present
        try {
            const { seedCategories } = await import('./config/seedCategories.js');
            await seedCategories();
        } catch (seedErr) {
            console.warn('Category seeding notice:', seedErr.message);
        }

        app.listen(port, () => {
            console.log(`🚀 API server running in ${nodeEnv} mode on port ${port}`);
        });
    })
    .catch((err) => {
        console.error('❌ Failed to connect to database:', err);
        process.exit(1);
    });

export default app;
