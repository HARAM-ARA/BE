import sizeOf from 'image-size';

export async function validateImage(buffer) {
  try {
    const dimensions = sizeOf(buffer);

    if (!dimensions || !dimensions.width || !dimensions.height) {
      throw new Error('Invalid image file');
    }

    const allowedTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    if (!allowedTypes.includes(dimensions.type)) {
      throw new Error(`Image type must be one of: ${allowedTypes.join(', ')}`);
    }

    const maxSize = 5 * 1024 * 1024;
    if (buffer.length > maxSize) {
      throw new Error('Image size must be less than 5MB');
    }

    return {
      width: dimensions.width,
      height: dimensions.height,
      type: dimensions.type,
    };
  } catch (error) {
    throw new Error(`Image validation failed: ${error.message}`);
  }
}

export function getImageMimeType(type) {
  const mimeTypes = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
  };
  return mimeTypes[type] || 'application/octet-stream';
}