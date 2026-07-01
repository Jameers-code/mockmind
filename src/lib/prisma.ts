import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
  return new PrismaClient();
};

/* eslint-disable no-var */
declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}
/* eslint-enable no-var */

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;
