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

        // Check wildcard subdomain matches (e.g. *.vercel.app)
        const isMatched = allowedOrigins.some((allowed) => {
            if (allowed.startsWith('*.')) {
                const domain = allowed.slice(2);
                return origin.endsWith(domain);
            }
            return false;
        });

        if (isMatched) {
            return callback(null, true);
        }

        return callback(new Error(`CORS Error: Origin ${origin} is not allowed by CORS policy`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    exposedHeaders: ['Set-Cookie'],
    maxAge: 86400, // 24 hours preflight cache
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

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
    .then(() => {
        app.listen(port, () => {
            console.log(`🚀 API server running in ${nodeEnv} mode on port ${port}`);
        });
    })
    .catch((err) => {
        console.error('❌ Failed to connect to database:', err);
        process.exit(1);
    });

export default app;
