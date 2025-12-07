import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 파일 저장 설정
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads/store-images'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'store-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// 파일 필터 (이미지만 허용)
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('INVALID_IMAGE'), false);
  }
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
    return res.status(400).json({
      code: 'INVALID_IMAGE',
      message: '이미지가 잘못되었습니다.'
    });
  }
}
