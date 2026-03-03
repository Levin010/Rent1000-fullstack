import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ 
  connectionString: process.env.DATABASE_URL 
})

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// apparent fix if i use rds, to bypass adapter issues

// const pool = new Pool({ 
//   connectionString: process.env.DATABASE_URL,
//   ssl: {
//     rejectUnauthorized: true, // Now we ARE verifying
//     ca: fs.readFileSync('/root/Rent1000-fullstack/server/global-bundle.pem').toString(),
//   }
// })