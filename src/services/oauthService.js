import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { userModel } from '../models/userModel.js';
import { updateUserCache } from '../middlewares/logger.js';

export async function exchangeCodeForToken(code) {
  const tokenEndpoint = 'https://oauth2.googleapis.com/token';

  const params = new URLSearchParams({
    code,
    client_id: config.google.clientId,
    client_secret: config.google.clientSecret,
    redirect_uri: config.google.redirectUri,
    grant_type: 'authorization_code',
  });

  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Token exchange failed: ${error.error_description || error.error}`);
  }

  return await response.json();
}

export async function getUserInfo(accessToken) {
  const userInfoEndpoint = 'https://www.googleapis.com/oauth2/v2/userinfo';

  const response = await fetch(userInfoEndpoint, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user info');
  }

  return await response.json();
}

export function generateJWT(user) {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: '7d',
  });
}

export async function authenticateWithGoogle(code) {
  const tokenData = await exchangeCodeForToken(code);
  const googleUser = await getUserInfo(tokenData.access_token);

  // 역할 결정: 기본 student, 특정 조건이면 teacher
  let role = 'student';

  if (googleUser.email) {
    // 이메일이 BSSM 도메인이 아니고 특별 허용 문자열도 없으면 거부(선택)
    if (!googleUser.email.endsWith('@bssm.hs.kr') && !googleUser.email.includes('haram123isi123isi')) {
      throw new Error('NOT_BSSM_EMAIL');
    }

    // teacher 판정: 주소에 teacher 또는 테스트용 문자열 포함 시
    if (googleUser.email.includes('teacher') || googleUser.email.includes('haram123isi123isi')) {
      role = 'teacher';
    }
  }

  // 기존 사용자 조회/생성
  let user = userModel.findByEmail(googleUser.email);

  if (!user) {
    const userId = userModel.create({
      email: googleUser.email,
      name: googleUser.name,
      role: role,
      googleId: googleUser.id,
    });

    user = userModel.findById(userId);

    // 새 사용자 캐시에 추가
    updateUserCache(user.id, user.name);
  }

  const token = generateJWT(user);

  return {
    user,
    token,
  };
}
