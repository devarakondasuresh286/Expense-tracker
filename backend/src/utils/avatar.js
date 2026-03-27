import { createHttpError } from './httpError.js';

const MAX_AVATAR_LENGTH = 2_000_000;

export const normalizeAvatarDataUrl = (value, { fieldName = 'profile picture' } = {}) => {
  if (value == null || value === '') {
    return '';
  }

  const avatarDataUrl = String(value).trim();

  const isSupportedImage = /^data:image\/(png|jpe?g|webp);base64,/i.test(avatarDataUrl);
  if (!isSupportedImage) {
    throw createHttpError(400, `Invalid ${fieldName} format. Use PNG, JPG, or WEBP image.`);
  }

  if (avatarDataUrl.length > MAX_AVATAR_LENGTH) {
    throw createHttpError(400, `${fieldName} is too large. Please choose a smaller image.`);
  }

  return avatarDataUrl;
};
