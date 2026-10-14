import { z } from "zod";

const environmentSchema = z.object({
  NODE_ENV: z.string().trim().pipe(
    z.enum(["development", "test", "production"])
  ).optional(),
  HOST: z.string().trim().min(1, {
    error: "must not be empty"
  }).optional(),
  PORT: z.string().trim().regex(/^\\d+$/, {
    error: "must be an integer from 1 through 65535"
  }).transform(Number).pipe(
    z.number().int().min(1).max(65535)
  ).optional()
}).transform(({ NODE_ENV, HOST, PORT }) => ({
  nodeEnv: NODE_ENV ?? "development",
  host: HOST ?? "127.0.0.1",
  port: PORT ?? 3000
}));

export type AppConfig = Readonly<z.output<typeof environmentSchema>>;

/** A safe configuration error that reports fields and rules, never raw values. */
export class ConfigurationError extends Error {
  constructor(details: readonly string[]) {
    super(`Invalid configuration: ${details.join("; ")}`);
    this.name = "ConfigurationError";
  }
}

/**
 * Loads, normalizes, validates, and freezes application configuration.
 * This is the only module that reads process.env.
 */
export function loadConfig(env?: NodeJS.ProcessEnv): AppConfig {
  const source = env ?? process.env;
  const result = environmentSchema.safeParse({
    NODE_ENV: source.NODE_ENV,
    HOST: source.HOST,
    PORT: source.PORT
  });

  if (!result.success) {
    const details = result.error.issues.map((issue) => {
      const field = issue.path.map(String).join(".") || "configuration";
      return `${field}: ${issue.message}`;
    });
    throw new ConfigurationError(details);
  }

  return Object.freeze(result.data);
}
