import { PrismaClient } from "@prisma/client";
import { config } from "../config/env";

// Singleton do PrismaClient para evitar múltiplas conexões
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: config.isDevelopment ? ["query", "error", "warn"] : ["error"],
  });

if (config.isDevelopment) {
  globalForPrisma.prisma = prisma;
}

export default prisma;
