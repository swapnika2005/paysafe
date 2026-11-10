import path from 'path'
import { fileURLToPath } from 'url'
import { config as loadEnv } from 'dotenv'
import { defineConfig } from 'prisma/config'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

loadEnv({ path: path.join(__dirname, '.env') })

export default defineConfig({
  earlyAccess: true,
  schema: path.join(__dirname, 'src', 'prisma', 'schema.prisma'),
  migrations: {
    path: path.join(__dirname, 'src', 'prisma', 'migrations'),
  },
  datasource: {
    url: process.env.DATABASE_URL,
    directUrl: process.env.DIRECT_URL,
  },
  migrate: {
    async adapter() {
      const { PrismaPg } = await import('@prisma/adapter-pg')
      return new PrismaPg({ connectionString: process.env.DIRECT_URL })
    },
  },
})