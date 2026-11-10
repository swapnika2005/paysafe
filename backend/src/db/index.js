import dotenv from "dotenv";
dotenv.config();

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const connectDb = async () => {
  try {
    await prisma.$connect();
    console.log("PostgreSQL connected via Prisma");
    return prisma;
  } catch (error) {
    console.error("PostgreSQL connection error:", error);
    throw error;
  }
};

export { prisma };
export default connectDb;