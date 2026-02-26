import { PrismaClient, Prisma } from '../src/generated/prisma/client';
import { PrismaLibSql } from "@prisma/adapter-libsql";

const adapter = new PrismaLibSql({
    url: process.env.DATABASE_URL || ''
});
const prisma = new PrismaClient({ adapter });
prisma.$connect();

export { prisma };
