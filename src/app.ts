import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import crypto from "crypto";
import { pinoHttp } from "pino-http";

import bandRoutes from "./routes/band.routes";
import calendarRoutes from "./routes/calendar.routes";
import environmentRoutes from "./routes/environment.routes";
import adminRoutes from "./routes/admin.routes";
import authRoutes from "./routes/auth.routes";

import { authenticate } from "./middlewares/authenticate";
import { errorHandler } from "./middlewares/errors/errorHandler";
import { requestLoggerMiddleware } from "./middlewares/logger/requestLogger";

import logger from "./lib/logger";

const app = express();

app.set('trust proxy', 1);

app.use(pinoHttp({
    logger,
    autoLogging: false, // disable pino-http start/finish logs to avoid duplication
    genReqId: (req) => {
        return (req.headers['x-request-id'] as string) || crypto.randomUUID();
    }
}));
app.use(helmet());
app.use(express.json());
app.use(cookieParser());
app.use(requestLoggerMiddleware);

const isProd = process.env.NODE_ENV === 'production';

//& CORS: configure based on your frontend origin
// TODO: uncomment after frontend implementation
/*
if(!isProd) {
    const cors = import('cors') as any;
    const allowedOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';
    
    app.use(cors({
        origin: allowedOrigin,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
    }));
}
*/

// rate limiting for auth endpoints
const authLimiter = rateLimit({
    windowMs: Number(process.env.AUTH_RATE_WINDOW_MS) || 15*60*1000,
    max: Number(process.env.AUTH_RATE_MAX) || (isProd ? 100 : 1000),
    message: { error: 'Too many requests, try again later.' }
});

app.use('/api/interface/admin', adminRoutes);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/v1/band', bandRoutes);
app.use('/api/v1/calendar', calendarRoutes);
app.use('/api/v1/environment', environmentRoutes);

app.use(errorHandler);

// health/readiness endpoints
app.get('/health', (_req, _res) => _res.status(200).json({ ok: true, env: process.env.NODE_ENV }));
app.get('/ready', (_req, _res) => _res.status(200).json({ ready: true }));

// TODO: example protected endpoint, delete after confirmation
app.get('/protected', authenticate, (req, res) => {
    req.log.info({ userId: req.user?.id }, 'Fetching user data...');
    res.json({ message: 'Hello protected route', user: req.user });
});

export default app;