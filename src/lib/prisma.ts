import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

declare global {
  // eslint-disable-next-line no-var
  var _prisma: PrismaClient | undefined;
}

function createClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL!;
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error"] : [],
  });
}

// Lazy singleton — only instantiated on first access, not at module load time
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    if (!global._prisma) {
      global._prisma = createClient();
    }
    const value = (global._prisma as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === "function" ? value.bind(global._prisma) : value;
  },
});
