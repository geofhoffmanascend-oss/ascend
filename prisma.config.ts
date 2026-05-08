import 'dotenv/config'
import * as dotenvLocal from 'dotenv'
import { defineConfig } from 'prisma/config'

dotenvLocal.config({ path: '.env.local', override: true })

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env['DATABASE_URL'],
  },
})
