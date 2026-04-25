import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import path from 'path';

import authRoutes from './routes/auth';
import formRoutes from './routes/forms';
import leadRoutes from './routes/leads';
import routingRoutes from './routes/routing';
import templateRoutes from './routes/templates';
import dashboardRoutes from './routes/dashboard';
import webhookRoutes from './routes/webhooks';
import { errorHandler } from './middleware/errorHandler';
import { authenticate } from './middleware/auth';
import { setupWebSocket } from './services/websocket';
import { connectQueue } from './queue/connection';
import { setIo } from './lib/socket';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  },
});
setIo(io);

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve widget publicly
app.use('/widget', express.static(path.join(process.cwd(), 'public/widget')));

// Public routes
app.use('/api/auth', authRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/forms/public', formRoutes);

// Protected routes
app.use('/api/leads', authenticate, leadRoutes);
app.use('/api/forms', authenticate, formRoutes);
app.use('/api/routing', authenticate, routingRoutes);
app.use('/api/templates', authenticate, templateRoutes);
app.use('/api/dashboard', authenticate, dashboardRoutes);

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

httpServer.listen(PORT, async () => {
  console.log(`🚀 Speed to Lead server running on port ${PORT}`);
  await connectQueue();
});

export { io };
