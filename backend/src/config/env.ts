import dotenv from "dotenv";

dotenv.config();

export const config = {
  env: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT) || 3333,
  frontendUrl: process.env.FRONTEND_URL ?? "http://192.168.18.32:5173",
  databaseUrl: process.env.DATABASE_URL ?? "file:./dev.db",
  isDevelopment: (process.env.NODE_ENV ?? "development") === "development",
  isProduction: process.env.NODE_ENV === "production",
};
