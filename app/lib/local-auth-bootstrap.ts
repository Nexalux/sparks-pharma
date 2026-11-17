let localAuthSchemaReady: Promise<void> | null = null;

export function ensureLocalAuthSchema(db: D1Database) {
  if (localAuthSchemaReady) return localAuthSchemaReady;
  localAuthSchemaReady = db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS "user" (
      "id" text PRIMARY KEY NOT NULL,
      "name" text NOT NULL,
      "email" text NOT NULL,
      "emailVerified" integer DEFAULT false NOT NULL,
      "image" text,
      "createdAt" integer NOT NULL,
      "updatedAt" integer NOT NULL
    )`),
    db.prepare(`CREATE UNIQUE INDEX IF NOT EXISTS "idx_auth_user_email" ON "user" ("email")`),
    db.prepare(`CREATE TABLE IF NOT EXISTS "session" (
      "id" text PRIMARY KEY NOT NULL,
      "expiresAt" integer NOT NULL,
      "token" text NOT NULL,
      "createdAt" integer NOT NULL,
      "updatedAt" integer NOT NULL,
      "ipAddress" text,
      "userAgent" text,
      "userId" text NOT NULL,
      FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE cascade
    )`),
    db.prepare(`CREATE UNIQUE INDEX IF NOT EXISTS "idx_auth_session_token" ON "session" ("token")`),
    db.prepare(`CREATE INDEX IF NOT EXISTS "idx_auth_session_user" ON "session" ("userId")`),
    db.prepare(`CREATE TABLE IF NOT EXISTS "account" (
      "id" text PRIMARY KEY NOT NULL,
      "accountId" text NOT NULL,
      "issuer" text NOT NULL,
      "providerId" text NOT NULL,
      "userId" text NOT NULL,
      "accessToken" text,
      "refreshToken" text,
      "idToken" text,
      "accessTokenExpiresAt" integer,
      "refreshTokenExpiresAt" integer,
      "scope" text,
      "password" text,
      "createdAt" integer NOT NULL,
      "updatedAt" integer NOT NULL,
      FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE cascade
    )`),
    db.prepare(`CREATE INDEX IF NOT EXISTS "idx_auth_account_user" ON "account" ("userId")`),
    db.prepare(`CREATE UNIQUE INDEX IF NOT EXISTS "idx_auth_account_issuer" ON "account" ("issuer", "accountId")`),
    db.prepare(`CREATE TABLE IF NOT EXISTS "verification" (
      "id" text PRIMARY KEY NOT NULL,
      "identifier" text NOT NULL,
      "value" text NOT NULL,
      "expiresAt" integer NOT NULL,
      "createdAt" integer,
      "updatedAt" integer
    )`),
    db.prepare(`CREATE INDEX IF NOT EXISTS "idx_auth_verification_identifier" ON "verification" ("identifier")`),
  ]).then(() => undefined).catch((error) => {
    localAuthSchemaReady = null;
    throw error;
  });
  return localAuthSchemaReady;
}
