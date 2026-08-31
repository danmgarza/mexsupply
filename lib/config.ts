import { config } from "dotenv";
import { z } from "zod";

config({ path: ".env.local", quiet: true });
config({ quiet: true });

const optionalString = z.preprocess((value) => (value === "" ? undefined : value), z.string().optional());
const optionalUrl = z.preprocess((value) => (value === "" ? undefined : value), z.string().url().optional());

const envSchema = z.object({
  DATABASE_URL: optionalUrl,
  DENUE_API_TOKEN: optionalString,
  DENUE_API_BASE_URL: z.string().url().default("https://www.inegi.org.mx/app/api/denue/v1/consulta"),
  DENUE_SOURCE_VERSION: z.string().default("live-api-current"),
  LOG_LEVEL: z.string().default("info"),
  NEXT_PUBLIC_SUPABASE_URL: optionalUrl,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: optionalString
});

export const env = envSchema.parse(process.env);
