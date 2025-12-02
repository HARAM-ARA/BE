export function validatePrice(price) {
  if (typeof price !== 'number' || price < 0) {
    throw new Error('Price must be a non-negative number');
  }
  return true;
}

export function validateQuantity(quantity) {
  if (!Number.isInteger(quantity) || quantity < 0) {
    throw new Error('Quantity must be a non-negative integer');
  }
  return true;
}

export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format');
  }
  return true;
}

export function validateString(value, fieldName, minLength = 1, maxLength = 255) {
  if (typeof value !== 'string' || value.length < minLength || value.length > maxLength) {
    throw new Error(`${fieldName} must be a string between ${minLength} and ${maxLength} characters`);
  }
  return true;
}