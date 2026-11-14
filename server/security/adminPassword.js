import { createHmac } from 'node:crypto';
import bcrypt from 'bcryptjs';

function passwordMaterial(password) {
  const pepper = process.env.PASSWORD_PEPPER;
  if (!pepper || Buffer.byteLength(pepper) < 32) {
    throw new Error('PASSWORD_PEPPER must be set to at least 32 random bytes.');
  }
  return createHmac('sha256', pepper).update(password, 'utf8').digest('hex');
}

export async function hashAdminPassword(password) {
  return bcrypt.hash(passwordMaterial(password), 12);
}

export async function verifyAdminPassword(password, passwordHash, isPeppered) {
  if (isPeppered) {
    return bcrypt.compare(passwordMaterial(password), passwordHash);
  }
  return bcrypt.compare(password, passwordHash);
}
