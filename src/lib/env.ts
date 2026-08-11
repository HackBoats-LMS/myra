const REQUIRED_ENV_VARS = [
  "DATABASE_URL",
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

export function validateEnv() {
  const missing: string[] = [];

  REQUIRED_ENV_VARS.forEach((key) => {
    if (!process.env[key]) {
      missing.push(key);
    }
  });

  if (missing.length > 0) {
    throw new Error(
      `\n[FATAL ERROR] Missing required environment variables:\n` +
      missing.map((key) => ` - ${key}`).join("\n") +
      `\n\nPlease check your .env configuration file.`
    );
  }
}
