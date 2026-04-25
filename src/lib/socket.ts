import { Server } from 'socket.io';

export let io: Server | undefined;

export const setIo = (server: Server) => {
  io = server;
};
