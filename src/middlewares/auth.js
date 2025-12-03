import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { userModel } from '../models/userModel.js';

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '토큰이 누락됐습니다.' });
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: '권한이 부족합니다.' });
  }
}

export function requireTeacher(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: '토큰이 누락됐습니다.' });
  }

  if (req.user.role !== 'teacher') {
    return res.status(403).json({ error: '권한이 부족합니다.' });
  }

  next();
}

export function requireStudent(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: '토큰이 누락됐습니다.' });
  }

  if (req.user.role !== 'student') {
    return res.status(403).json({ error: '권한이 부족합니다.' });
  }

  next();
}

export function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      req.user = decoded;
    } catch (error) {
      // Token invalid but continue anyway
    }
  }

  next();
}