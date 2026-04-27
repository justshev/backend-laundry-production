import { env } from "../config/env";
import { createPrismaClient as buildPrismaClient } from "./create-prisma-client";

import type { PrismaClient } from "@prisma/client";

declare global {
  var prismaGlobal: PrismaClient | undefined;
}

const createAppPrismaClient = () =>
  buildPrismaClient(
    env.DATABASE_URL,
    env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["error"],
  );

export const prisma = global.prismaGlobal ?? createAppPrismaClient();

if (env.NODE_ENV !== "production") {
  global.prismaGlobal = prisma;
}
