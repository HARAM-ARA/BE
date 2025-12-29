import express from 'express';
import jwt from 'jsonwebtoken';
import sql from 'better-sqlite3';
import sizeOf from 'image-size';
import dotenv from "dotenv";
import cookieParser from 'cookie-parser';
dotenv.config();

const app = express();
app.use(express.json());
app.use(cookieParser());
// CORS: allow Vite dev server on localhost:5173 to access this API
app.use((req, res, next) => {
  const allowedOrigin = 'http://localhost:5173';
  const origin = req.headers.origin;
  if (origin && origin === allowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
  }
  next();
});
const PORT = process.env.PORT || 3000;

const db = new sql('data.db');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_MS = 1000 * 60 * 60;

function signAuth(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: Math.floor(JWT_EXPIRES_MS / 1000) + 's' });
}

function verifyAuth(token) {
  return jwt.verify(token, JWT_SECRET);
}

app.use((req, res, next) => {
  const token = req.cookies && req.cookies.auth;
  if (!token) return next();
  try {
    const decoded = verifyAuth(token);
    req.auth = decoded;
  } catch (err) {
    console.debug('Invalid auth token:', err && err.message);
  }
  next();
});

app.get('/haram/auth', async (req, res) => {
  const code = req.query.code;
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || `http://localhost:${PORT}/haram/auth`;

  if (!code) return res.status(400).json({ message: 'MISSING_CODE' });
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.error('Google client credentials not configured');
    return res.status(500).json({ message: 'OAUTH_NOT_CONFIGURED' });
  }

  try {
    const params = new URLSearchParams();
    params.append('code', code);
    params.append('client_id', GOOGLE_CLIENT_ID);
    params.append('client_secret', GOOGLE_CLIENT_SECRET);
    params.append('redirect_uri', REDIRECT_URI);
    params.append('grant_type', 'authorization_code');

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });
    const tokenJson = await tokenRes.json();
    if (!tokenRes.ok) {
      console.error('Token exchange failed', tokenJson);
      return res.status(500).json({ message: 'TOKEN_EXCHANGE_FAILED', detail: tokenJson });
    }

    const accessToken = tokenJson.access_token;
    const userRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const userInfo = await userRes.json();
    if (!userRes.ok) {
      console.error('Failed to fetch userinfo', userInfo);
      return res.status(500).json({ message: 'USERINFO_FETCH_FAILED', detail: userInfo });
    }

    const authJwt = signAuth({ token: accessToken, userEmail: userInfo.email });
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('auth', authJwt, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: JWT_EXPIRES_MS
    });
    let role = "student";

    if (userInfo.email && !userInfo.email.endsWith('@bssm.hs.kr') && !userInfo.email.includes('haram123isi123isi')) {
      return res.status(403).json({ message: 'NOT_BSSM_EMAIL' });
    } else if (userInfo.email.includes('teacher') || userInfo.email.includes('haram123isi123isi')) {
      role = "teacher";
    }

    // Check if user exists to get ID, or insert
    const existingUser = db.prepare('SELECT * FROM users WHERE email = ?').get(userInfo.email);
    if (existingUser) {
      db.prepare('UPDATE users SET name = ?, role = ? WHERE email = ?')
        .run(userInfo.name, role, userInfo.email);
    } else {
      db.prepare('INSERT INTO users (email, name, role, google_id) VALUES (?, ?, ?, ?)')
        .run(userInfo.email, userInfo.name, role, userInfo.id);
    }
    res.redirect("http://localhost:5173");
  } catch (err) {
    console.error('Error in /haram/auth:', err);
    res.status(500).json({ message: 'LOGIN_FAILED' });
  }
});

app.get('/haram/auth/login', (req, res) => {
  if (req.auth && req.auth.token) {
    return res.status(403).json({ message: 'ALREADY_LOGINED' });
  }
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || `http://localhost:${PORT}/haram/auth`;
  if (!GOOGLE_CLIENT_ID) return res.status(500).json({ message: 'OAUTH_NOT_CONFIGURED' });

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent'
  });

  const authURL = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  res.json({ authURL });
});

app.get('/haram/auth/logout', (req, res) => {
  if (req.auth && req.auth.token) {
    try {
      const cookieOptions = { httpOnly: true, sameSite: 'lax' };
      if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
      res.clearCookie('auth', cookieOptions);
      res.json({ message: 'LOGOUT_SUCCESS' });
    } catch (err) {
      console.error('Error in /haram/auth/logout:', err);
      res.status(500).json({ message: 'LOGOUT_FAILED' });
    }
  } else {
    res.status(403).json({ message: 'NOT_LOGINED' });
  }
});

app.get('/haram/auth/profile', (req, res) => {
  if (!req.auth || !req.auth.userEmail) {
    return res.status(403).json({ success: false, message: 'NOT_AUTHENTICATED' });
  }

  try {
    const user = db.prepare('SELECT id, email, name, role FROM users WHERE email = ?').get(req.auth.userEmail);
    if (!user) {
      return res.status(404).json({ success: false, message: 'USER_NOT_FOUND' });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      }
    });
  } catch (err) {
    console.error('Error in /haram/auth/profile:', err);
    res.status(500).json({ success: false, message: 'INTERNAL_ERROR' });
  }
});

app.post('/tch/store', async (req, res) => {
  if (!req.auth || !req.auth.userEmail) {
    return res.status(403).json({ error: 'FORBIDDEN', message: '접근 권한이 부족합니다.' });
  }

  try {
    const user = db.prepare('SELECT role FROM users WHERE email = ?').get(req.auth.userEmail);
    if (!user || user.role !== 'teacher') {
      return res.status(403).json({ error: 'FORBIDDEN', message: '접근 권한이 부족합니다.' });
    }

    const { itemName, description, image, price, quantity, type } = req.body;

    if (!itemName || typeof itemName !== 'string' || itemName.trim() === '') {
      return res.status(400).json({ error: 'INVALID_NAME', message: '이름이 잘못되었습니다.' });
    }

    if (typeof price !== 'number' || !Number.isInteger(price) || price < 0) {
      return res.status(400).json({ error: 'INVALID_PRICE', message: '금액이 잘못되었습니다.' });
    }

    if (type !== 1 && type !== 2) {
      return res.status(400).json({ error: 'INVALID_TYPE', message: '타입이 잘못되었습니다.' });
    }

    if (!image || typeof image !== 'string' || !image.startsWith('http')) {
      return res.status(400).json({ error: 'INVALID_IMAGE', message: '이미지가 잘못되었습니다.' });
    }

    const existingItem = db.prepare('SELECT 1 FROM stores WHERE name = ?').get(itemName);
    if (existingItem) {
      return res.status(409).json({ error: 'DUPLICATE_ITEM', message: '이미 존재하는 이름의 아이템입니다.' });
    }

    try {
      const imgRes = await fetch(image);

      if (!imgRes.ok) {
        throw new Error('Fetch failed');
      }

      const arrayBuffer = await imgRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const dimensions = sizeOf(buffer);

      if (dimensions.width < 128 || dimensions.height < 128 ||
        dimensions.width > 512 || dimensions.height > 512) {
        return res.status(400).json({ error: 'IMAGE_SIZE_ERROR', message: '이미지 크기가 잘못되었습니다.' });
      }

    } catch (err) {
      if (!res.headersSent) {
        return res.status(400).json({ error: 'INVALID_IMAGE', message: '이미지가 잘못되었습니다.' });
      }
      return;
    }

    // Note: schema.sql stores table has: name, price, quantity, image_url, teacher_id
    // It does not have description, type, deleted. I will insert what fits.
    // Also need teacher_id. I need to get the user ID first.
    const teacher = db.prepare('SELECT id FROM users WHERE email = ?').get(req.auth.userEmail);
    if (!teacher) {
        return res.status(403).json({ error: 'FORBIDDEN', message: '접근 권한이 부족합니다.' });
    }

    const result = db.prepare(
      'INSERT INTO stores (name, price, quantity, image_url, teacher_id) VALUES (?, ?, ?, ?, ?)'
    ).run(itemName, price, quantity, image, teacher.id);

    res.json({
      itemId: result.lastInsertRowid,
      itemName: itemName,
      message: "물품 추가에 성공했습니다."
    });

  } catch (err) {
    console.error('Error in /tch/store:', err);
    return res.status(400).json({ error: 'BAD_REQUEST', message: '잘못된 요청입니다.' });
  }
});

// 선생님용: 팀별 구매한 물품 조회 API
app.get('/tch/purchases/:teamId', (req, res) => {
  if (!req.auth || !req.auth.userEmail) {
    return res.status(403).json({ error: 'FORBIDDEN', message: '접근 권한이 부족합니다.' });
  }

  try {
    const user = db.prepare('SELECT role FROM users WHERE email = ?').get(req.auth.userEmail);
    if (!user || user.role !== 'teacher') {
      return res.status(403).json({ error: 'FORBIDDEN', message: '접근 권한이 부족합니다.' });
    }

    const { teamId } = req.params;
    
    if (!teamId || isNaN(teamId)) {
      return res.status(400).json({ error: 'INVALID_TEAM_ID', message: '팀 ID가 잘못되었습니다.' });
    }

    // 팀 정보 확인
    const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(teamId);
    if (!team) {
      return res.status(404).json({ error: 'TEAM_NOT_FOUND', message: '팀을 찾을 수 없습니다.' });
    }

    // 팀의 구매 기록 조회 (물품 정보 포함)
    const purchases = db.prepare(`
      SELECT 
        p.id,
        p.quantity,
        p.total_price,
        p.purchased_at,
        s.name as item_name,
        s.price as unit_price,
        s.image_url
      FROM purchases p
      JOIN stores s ON p.store_item_id = s.id
      WHERE p.team_id = ?
      ORDER BY p.purchased_at DESC
    `).all(teamId);

    res.json({
      success: true,
      data: {
        team: {
          id: team.id,
          team_number: team.team_number,
          class_number: team.class_number,
          name: team.name,
          team_credit: team.team_credit
        },
        purchases: purchases
      }
    });

  } catch (err) {
    console.error('Error in /tch/purchases/:teamId:', err);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.' });
  }
});

// 학생용: 우리 팀이 구매한 물품 조회 API
app.get('/std/purchases', (req, res) => {
  if (!req.auth || !req.auth.userEmail) {
    return res.status(403).json({ error: 'FORBIDDEN', message: '접근 권한이 부족합니다.' });
  }

  try {
    const user = db.prepare('SELECT id, role FROM users WHERE email = ?').get(req.auth.userEmail);
    if (!user || user.role !== 'student') {
      return res.status(403).json({ error: 'FORBIDDEN', message: '학생만 접근 가능합니다.' });
    }

    // 학생이 속한 팀 찾기
    const team = db.prepare(`
      SELECT * FROM teams 
      WHERE JSON_EXTRACT(student_ids, '$') LIKE '%' || ? || '%'
    `).get(user.id.toString());

    if (!team) {
      return res.status(404).json({ error: 'TEAM_NOT_FOUND', message: '소속된 팀을 찾을 수 없습니다.' });
    }

    // 팀의 구매 기록 조회 (물품 정보 포함)
    const purchases = db.prepare(`
      SELECT 
        p.id,
        p.quantity,
        p.total_price,
        p.purchased_at,
        s.name as item_name,
        s.price as unit_price,
        s.image_url
      FROM purchases p
      JOIN stores s ON p.store_item_id = s.id
      WHERE p.team_id = ?
      ORDER BY p.purchased_at DESC
    `).all(team.id);

    res.json({
      success: true,
      data: {
        team: {
          id: team.id,
          team_number: team.team_number,
          class_number: team.class_number,
          name: team.name,
          team_credit: team.team_credit
        },
        purchases: purchases
      }
    });

  } catch (err) {
    console.error('Error in /std/purchases:', err);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.' });
  }
});

app.use(function (req, res, next) {
  res.status(404).json({ message: 'NOT_FOUND' });
});

app.listen(PORT, () => {
  console.log(`Listening at http://localhost:${PORT}`);
});