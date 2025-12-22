import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 파일 저장 설정
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dest = path.join(__dirname, '../../uploads/store-images');
    // Ensure destination directory exists
    try {
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }
      cb(null, dest);
    } catch (err) {
      console.error('Failed to ensure upload destination exists:', err);
      cb(err);
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'store-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// 파일 필터 (이미지만 허용)
const fileFilter = (req, file, cb) => {
  const allowedMimePrefix = 'image/';
  const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];

  // 기본적으로 mime type이 image/로 시작하면 허용
  if (file.mimetype && file.mimetype.startsWith(allowedMimePrefix)) {
    return cb(null, true);
  }

  // mime type이 없거나 비표준인 경우 파일 확장자로 체크
  const ext = path.extname(file.originalname || '').toLowerCase();
  if (allowedExts.includes(ext)) {
    return cb(null, true);
  }

  // 그 외는 거부. 이후 validateImageSize에서 최종 검증을 수행합니다.
  console.warn('upload.fileFilter: rejected file', { name: file.originalname, mimetype: file.mimetype });
  cb(new Error('INVALID_IMAGE'), false);
};

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// 이미지 크기 검증 미들웨어
export async function validateImageSize(req, res, next) {
  if (!req.file) {
    return res.status(400).json({
      code: 'INVALID_IMAGE',
      message: '이미지가 잘못되었습니다.'
    });
  }

  try {
    const metadata = await sharp(req.file.path).metadata();
    const { width, height } = metadata;

    // 크기 검증: 최소 128x128, 최대 512x512
    if (width < 128 || height < 128 || width > 512 || height > 512) {
      // 파일 삭제
      const fs = await import('fs/promises');
      await fs.unlink(req.file.path);

      return res.status(400).json({
        code: 'IMAGE_SIZE_ERROR',
        message: '이미지 크기가 잘못되었습니다.'
      });
    }

    next();
  } catch (error) {
    try {
      if (req.file && req.file.path) {
        await fs.promises.unlink(req.file.path).catch(() => {});
      }
    } catch (e) {
      /* ignore */
    }
    console.error('validateImageSize error:', error && error.message ? error.message : error);
    return res.status(400).json({
      code: 'INVALID_IMAGE',
      message: '이미지가 잘못되었습니다.'
    });
  }
}
