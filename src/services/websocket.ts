import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

export const setupWebSocket = (io: Server) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      socket.data.userId = decoded.userId;
      socket.data.organizationId = decoded.organizationId;

      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const { userId, organizationId } = socket.data;

    console.log(`🔌 User connected: ${userId}`);

    socket.join(`org:${organizationId}`);
    socket.join(`user:${userId}`);

    socket.on('ping', (callback: () => void) => {
      callback();
    });

    socket.on('lead:view', (leadId: string) => {
      socket.join(`lead:${leadId}`);
      socket.to(`org:${organizationId}`).emit('lead:viewing', { leadId, userId });
    });

    socket.on('lead:leave', (leadId: string) => {
      socket.leave(`lead:${leadId}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 User disconnected: ${userId}`);
    });
  });
};
