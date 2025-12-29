import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { userModel } from '../models/userModel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logsDir = path.join(__dirname, '../../logs');

// logs 디렉토리가 없으면 생성
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// 사용자 정보 캐시
let userCache = new Map();

// 사용자 캐시 초기화
export function initUserCache() {
  try {
    const users = userModel.findAll();
    userCache = new Map(users.map(user => [user.id, user.name]));
    console.log(`사용자 캐시 초기화 완료: ${userCache.size}명`);
  } catch (error) {
    console.error('사용자 캐시 초기화 실패:', error);
  }
}

// 사용자 캐시 갱신 (새 사용자 추가 시 호출)
export function updateUserCache(userId, userName) {
  userCache.set(userId, userName);
}

// 날짜별 로그 파일명 생성 (예: 2025-12-29.log)
function getLogFileName() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}.log`;
}

// 로그 메시지 포맷팅
function formatLogMessage(req, user) {
  const now = new Date();
  const timestamp = now.toISOString();
  const method = req.method;
  const url = req.originalUrl || req.url;
  const ip = req.ip || req.connection.remoteAddress || 'Unknown';

  let userInfo = 'Anonymous';
  if (user && user.id) {
    const userName = userCache.get(user.id) || 'Unknown';
    userInfo = `${userName} (ID: ${user.id})`;
  }

  return `[${timestamp}] ${method} ${url} - User: ${userInfo} - IP: ${ip}\n`;
}

// 로그를 파일에 기록
function writeLog(message) {
  const logFile = path.join(logsDir, getLogFileName());
  fs.appendFileSync(logFile, message, 'utf8');
}

// 로깅 미들웨어
export function requestLogger(req, res, next) {
  // 요청이 완료된 후에 로그 기록
  res.on('finish', () => {
    try {
      const logMessage = formatLogMessage(req, req.user);
      writeLog(logMessage);
    } catch (error) {
      console.error('로그 기록 중 오류 발생:', error);
    }
  });

  next();
}
