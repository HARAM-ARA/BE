import express from 'express';
import jwt from 'jsonwebtoken';
import sql from 'better-sqlite3';
import dotenv from "dotenv";
import cookieParser from 'cookie-parser';
dotenv.config();

const app = express();
app.use(express.json());
app.use(cookieParser());
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
    let type = "STUDENT";

    if (userInfo.email && !userInfo.email.endsWith('@bssm.hs.kr')) {
      return res.status(403).json({ message: 'NOT_BSSM_EMAIL' });
    } else if (userInfo.email.includes('teacher')) {
      type = "TEACHER";
    }
    db.prepare('INSERT INTO User (id, name, type) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET name = excluded.name, type = excluded.type')
      .run(userInfo.email, userInfo.name, type);
    res.redirect('/');
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

app.use(function(req, res, next) {
  res.status(404).json({ message: 'NOT_FOUND' });
});

app.listen(PORT, () => {
	console.log(`Listening at http://localhost:${PORT}`);
});