import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;
const DUMMY_PASSWORD_HASH = bcrypt.hashSync("taskflow-invalid-password", SALT_ROUNDS);

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function verifyPasswordAgainstDummy(password: string): Promise<void> {
  await bcrypt.compare(password, DUMMY_PASSWORD_HASH);
}
