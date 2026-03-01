const testEnv = process.env as Record<string, string | undefined>;

testEnv.NODE_ENV ??= "test";
testEnv.DATABASE_URL ??= "file:./prisma/test-env.db";
testEnv.NEXTAUTH_URL ??= "http://localhost:3000";
testEnv.NEXTAUTH_SECRET ??= "test-secret-at-least-32-characters";
testEnv.MAX_BODY_SIZE_BYTES ??= "1048576";
