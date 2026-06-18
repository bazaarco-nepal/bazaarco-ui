import { z } from "zod";

/** Treat blank .env values the same as missing so Zod reports "Required". */
function requiredString() {
  return z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().min(1),
  );
}

const envSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: requiredString(),
  NEXT_PUBLIC_BACKEND_URL: z.string().url(),
  NEXT_PUBLIC_CLARITY_PROJECT_ID: requiredString(),
  NEXT_PUBLIC_GA_MEASUREMENT_ID: requiredString(),
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: requiredString(),
  NEXT_PUBLIC_ALGOLIA_APP_ID: requiredString(),
  NEXT_PUBLIC_ALGOLIA_SEARCH_KEY: requiredString(),
  NEXT_PUBLIC_ALGOLIA_INDEX_NAME: requiredString(),
});

const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
  const formatted = parseResult.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  process.stderr.write(`Environment validation failed:\n${formatted}\n`);
  process.exit(1);
}

export const env = parseResult.data;
