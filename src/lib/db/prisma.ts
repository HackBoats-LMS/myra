import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma';

const globalForPrisma = global as unknown as { 
  prisma: PrismaClient;
  pool: Pool;
};

const rawConnectionString = process.env.DATABASE_URL;
// Strip any sslmode=require from the URL so pg-connection-string doesn't override our SSL options
const connectionString = rawConnectionString?.replace(/([?&])sslmode=[^&]+(&|$)/, '$1').replace(/[?&]$/, '');

// In development, allow self-signed certs; in production, always verify TLS.
const sslConfig = process.env.NODE_ENV === 'production'
  ? { rejectUnauthorized: true }
  : { rejectUnauthorized: false };

const pool =
  globalForPrisma.pool ||
  new Pool({
    connectionString,
    ssl: sslConfig,
    max: 10,
    idleTimeoutMillis: 15000,
    connectionTimeoutMillis: 10000,
    allowExitOnIdle: true,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
  });

// Catch idle socket disconnects to prevent unhandled pool errors when Supabase drops idle connections
pool.on('error', (err) => {
  console.warn('[PostgreSQL Pool] Connection reset by peer:', err.message);
});

if (process.env.NODE_ENV !== "production") globalForPrisma.pool = pool;

const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma && "brandStory" in globalForPrisma.prisma
    ? globalForPrisma.prisma
    : new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
