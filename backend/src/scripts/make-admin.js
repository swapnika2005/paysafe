import { prisma } from "../db/index.js";

await prisma.user.update({
  where: { email: "waseem@gmail.com" },
  data:  { role: "admin" },
});
console.log("✅ Admin role set");
await prisma.$disconnect();