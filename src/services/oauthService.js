import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { userModel } from '../models/userModel.js';

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

  let user = userModel.findByEmail(googleUser.email);

  if (!user) {
    const userId = userModel.create({
      email: googleUser.email,
      name: googleUser.name,
      role: 'student',
      googleId: googleUser.id,
    });

    user = userModel.findById(userId);
  }

  const token = generateJWT(user);

  return {
    user,
    token,
  };
}
