import { randomBytes } from "node:crypto";
import { z } from "zod";
const levels = ["trace", "debug", "info", "warn", "error", "fatal", "silent"] as const;
const schema = z.object({
  NODE_ENV: z
    .string()
    .trim()
    .pipe(z.enum(["development", "test", "production"]))
    .optional(),
  HOST: z.string().trim().min(1).optional(),
  PORT: z
    .string()
    .trim()
    .regex(/^\d+$/)
    .transform(Number)
    .pipe(z.number().int().min(1).max(65535))
    .optional(),
  MONGODB_URI: z
    .string()
    .trim()
    .min(1)
    .default("mongodb://127.0.0.1:27017/mern_enterprise_starter"),
  LOG_LEVEL: z.string().trim().pipe(z.enum(levels)).optional(),
  AUTH_JWT_SECRET: z.string().optional(),
  AUTH_JWT_ISSUER: z.string().trim().min(1).default("mern-enterprise-starter-api"),
  AUTH_JWT_AUDIENCE: z.string().trim().min(1).default("mern-enterprise-starter-clients"),
  AUTH_ACCESS_TOKEN_TTL_SECONDS: z
    .string()
    .trim()
    .regex(/^\d+$/)
    .transform(Number)
    .pipe(z.number().int().min(60).max(3600))
    .default(900),
  AUTH_ARGON2_TIME_COST: z
    .string()
    .trim()
    .regex(/^\d+$/)
    .transform(Number)
    .pipe(z.number().int().min(2).max(10))
    .default(2),
  AUTH_ARGON2_MEMORY_COST_KIB: z
    .string()
    .trim()
    .regex(/^\d+$/)
    .transform(Number)
    .pipe(z.number().int().min(19456).max(262144))
    .default(19456),
  AUTH_ARGON2_PARALLELISM: z
    .string()
    .trim()
    .regex(/^\d+$/)
    .transform(Number)
    .pipe(z.number().int().min(1).max(4))
    .default(1),
});
export type AppConfig = Readonly<{
  nodeEnv: "development" | "test" | "production";
  host: string;
  port: number;
  mongoUri: string;
  logLevel: (typeof levels)[number];
  authJwtSecret: string;
  authJwtIssuer: string;
  authJwtAudience: string;
  authAccessTokenTtlSeconds: number;
  authArgon2TimeCost: number;
  authArgon2MemoryCostKiB: number;
  authArgon2Parallelism: number;
}>;
export class ConfigurationError extends Error {
  constructor(d: readonly string[]) {
    super(`Invalid configuration: ${d.join("; ")}`);
    this.name = "ConfigurationError";
  }
}
export function loadConfig(env?: NodeJS.ProcessEnv): AppConfig {
  const s = env ?? process.env,
    r = schema.safeParse({
      NODE_ENV: s.NODE_ENV,
      HOST: s.HOST,
      PORT: s.PORT,
      MONGODB_URI: s.MONGODB_URI,
      LOG_LEVEL: s.LOG_LEVEL,
      AUTH_JWT_SECRET: s.AUTH_JWT_SECRET,
      AUTH_JWT_ISSUER: s.AUTH_JWT_ISSUER,
      AUTH_JWT_AUDIENCE: s.AUTH_JWT_AUDIENCE,
      AUTH_ACCESS_TOKEN_TTL_SECONDS: s.AUTH_ACCESS_TOKEN_TTL_SECONDS,
      AUTH_ARGON2_TIME_COST: s.AUTH_ARGON2_TIME_COST,
      AUTH_ARGON2_MEMORY_COST_KIB: s.AUTH_ARGON2_MEMORY_COST_KIB,
      AUTH_ARGON2_PARALLELISM: s.AUTH_ARGON2_PARALLELISM,
    });
  if (!r.success)
    throw new ConfigurationError(
      r.error.issues.map((i) => `${i.path.join(".") || "configuration"}: ${i.message}`),
    );
  const v = r.data,
    nodeEnv = v.NODE_ENV ?? "development",
    secret =
      v.AUTH_JWT_SECRET ?? (nodeEnv === "production" ? "" : randomBytes(32).toString("base64url"));
  if (Buffer.byteLength(secret) < 32)
    throw new ConfigurationError([
      "AUTH_JWT_SECRET: must contain at least 32 bytes and is required in production",
    ]);
  return Object.freeze({
    nodeEnv,
    host: v.HOST ?? "127.0.0.1",
    port: v.PORT ?? 3000,
    mongoUri: v.MONGODB_URI,
    logLevel:
      v.LOG_LEVEL ?? (nodeEnv === "production" ? "info" : nodeEnv === "test" ? "silent" : "debug"),
    authJwtSecret: secret,
    authJwtIssuer: v.AUTH_JWT_ISSUER,
    authJwtAudience: v.AUTH_JWT_AUDIENCE,
    authAccessTokenTtlSeconds: v.AUTH_ACCESS_TOKEN_TTL_SECONDS,
    authArgon2TimeCost: v.AUTH_ARGON2_TIME_COST,
    authArgon2MemoryCostKiB: v.AUTH_ARGON2_MEMORY_COST_KIB,
    authArgon2Parallelism: v.AUTH_ARGON2_PARALLELISM,
  });
}
