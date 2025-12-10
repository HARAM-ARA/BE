import { authenticateWithGoogle } from '../services/oauthService.js';
import { AppError } from '../middlewares/errorHandler.js';
import { config } from '../config/index.js';

export async function login(req, res, next) {
  try {
    const { code } = req.body;

    if (!code) {
      throw new AppError('Authorization code is required', 400);
    }

    const { user, token } = await authenticateWithGoogle(code);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getProfile(req, res, next) {
  try {
    res.json({
      success: true,
      data: {
        user: req.user,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(req, res, next) {
  try {
    res.json({
      message: '로그아웃 되었습니다.',
    });
  } catch (error) {
    next({
      status: 500,
      code: 'LOGOUT_FAILED',
      message: '로그아웃에 실패했습니다.',
    });
  }
}

export async function handleCallback(req, res, next) {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({ message: 'MISSING_CODE' });
    }

    const { user, token } = await authenticateWithGoogle(code);

    // Set cookie for browser-based auth
    const isProd = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
    };
    if (config.cookieDomain) {
      cookieOptions.domain = config.cookieDomain;
    }

    res.cookie('auth', token, cookieOptions);

    // Redirect to front-end (use configured client origin when available)
    res.redirect(config.clientOrigin || 'http://localhost:5173');
  } catch (error) {
    console.error('Error in /haram/auth:', error);
    next(error);
  }
}
