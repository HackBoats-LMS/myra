import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma';

const globalForPrisma = global as unknown as { 
  prisma: PrismaClient;
  pool: Pool;
};

const connectionString = process.env.DATABASE_URL;

// Tune the pool for hosted (Supabase) Postgres:
//  - connectionTimeoutMillis: fail fast instead of hanging forever when the
//    pooler is saturated (pg defaults to 0 = wait indefinitely, which is what
//    caused multi-second stalls on every button press).
//  - idleTimeoutMillis: free up pooler slots after idle so the pooler doesn't
//    reap connections out from under us.
//  - keepAlive + allowExitOnIdle: reuse connections and don't block dev exit.
//  - ssl: Supabase requires TLS (rejectUnauthorized disabled because Supabase
//    uses public certs that may not chain locally).
const pool =
  globalForPrisma.pool ||
  new Pool({
    connectionString,
    max: 10,
    connectionTimeoutMillis: 8000,
    idleTimeoutMillis: 30000,
    keepAlive: true,
    allowExitOnIdle: process.env.NODE_ENV !== "production",
    ssl: { rejectUnauthorized: false },
  });
if (process.env.NODE_ENV !== "production") globalForPrisma.pool = pool;

const adapter = new PrismaPg(pool);

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
