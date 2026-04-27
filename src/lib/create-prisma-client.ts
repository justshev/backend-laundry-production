import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "@prisma/client";

type PrismaLog = Prisma.PrismaClientOptions["log"];

export const createPrismaClient = (connectionString: string, log?: PrismaLog) => {
  const adapter = new PrismaPg({ connectionString });

  return new PrismaClient({
    adapter,
    log,
  });
};
