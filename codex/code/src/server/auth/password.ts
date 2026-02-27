import bcrypt from "bcrypt";

const DEFAULT_BCRYPT_SALT_ROUNDS = 12;
const MIN_BCRYPT_SALT_ROUNDS = 10;
const MAX_BCRYPT_SALT_ROUNDS = 14;

function resolveBcryptSaltRounds(): number {
  const configuredValue = process.env.BCRYPT_SALT_ROUNDS;

  if (configuredValue === undefined) {
    return DEFAULT_BCRYPT_SALT_ROUNDS;
  }

  const parsed = Number.parseInt(configuredValue, 10);
  if (Number.isNaN(parsed)) {
    return DEFAULT_BCRYPT_SALT_ROUNDS;
  }

  return Math.min(Math.max(parsed, MIN_BCRYPT_SALT_ROUNDS), MAX_BCRYPT_SALT_ROUNDS);
}

export const bcryptSaltRounds = resolveBcryptSaltRounds();

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, bcryptSaltRounds);
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}
