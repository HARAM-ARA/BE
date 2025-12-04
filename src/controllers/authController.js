import { authenticateWithGoogle } from '../services/oauthService.js';
import { AppError } from '../middlewares/errorHandler.js';

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
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
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
    res.cookie('auth', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
    });

    // Redirect to home page
    res.redirect('/');
  } catch (error) {
    console.error('Error in /haram/auth:', error);
    next(error);
  }
}
