import { Server } from 'socket.io';
import { config } from './index.js';

let io = null;

/**
 * Socket.IO 서버 초기화
 * @param {import('http').Server} httpServer - HTTP 서버 인스턴스
 */
export function initSocketServer(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: config.clientOrigin || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  console.log('[Socket.IO] Server initialized');
  return io;
}

/**
 * Socket.IO 인스턴스 반환
 * @returns {Server} Socket.IO 서버 인스턴스
 */
export function getIO() {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call initSocketServer first.');
  }
  return io;
}

/**
 * 새 공지 브로드캐스트
 * @param {Object} notice - 공지 데이터
 */
export function broadcastNewNotice(notice) {
  if (!io) {
    console.warn('[Socket.IO] Cannot broadcast: Socket.IO not initialized');
    return;
  }

  io.emit('notice:created', notice);
  console.log(`[Socket.IO] Broadcasted notice:created - ID: ${notice.noticeId}`);
}
