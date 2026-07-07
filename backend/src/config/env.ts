import dotenv from "dotenv";

dotenv.config();

const frontendUrls = (
  process.env.FRONTEND_URLS ??
  "http://localhost:5173,http://192.168.18.32:5173"
)
  .split(",")
  .map((url) => url.trim());

export const config = {
  env: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT) || 3333,
  frontendUrls,
  databaseUrl: process.env.DATABASE_URL ?? "file:./dev.db",
  isDevelopment: (process.env.NODE_ENV ?? "development") === "development",
  isProduction: process.env.NODE_ENV === "production",
};