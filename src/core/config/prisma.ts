import { PrismaClient } from '../.././../prisma/generated/client';
import { PrismaPg } from '@prisma/adapter-pg';
import logger from './logger';


// ─── Build the pg adapter ─────────────────────────────────
// Prisma 7 removed the built-in Rust connection engine.
// All connections now go through a driver adapter.
// PrismaPg wraps the `pg` package (node-postgres) as the adapter.

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined in environment variables.');
}

const adapter = new PrismaPg({ connectionString });


// ─── Singleton PrismaClient ───────────────────────────────
// globalThis cache prevents creating multiple connections
// during hot-reload in development (ts-node-dev)

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: [
      { level: 'error', emit: 'event' },
      ...(process.env.NODE_ENV === 'development'
        ? [{ level: 'query' as const, emit: 'event' as const }]
        : []),
    ],
  });


// ─── Route Prisma logs through winston ────────────────────
// Filter out NeonDB autosuspend noise (kind: Closed / cause: None)
// These are not real errors — NeonDB wakes up from idle and drops
// the old connection. Prisma retries automatically.

prisma.$on('error' as never, (e: any) => {
  const msg = e.message ?? '';

  const isConnectionNoise =
    msg.includes('kind: Closed')    ||
    msg.includes('kind: Reset')     ||
    msg.includes('ConnectionClosed')||
    msg.includes('cause: None');

  if (!isConnectionNoise) {
    logger.error('Prisma error', { message: msg, target: e.target });
  }
});

if (process.env.NODE_ENV === 'development') {
  prisma.$on('query' as never, (e: any) => {
    logger.debug('Prisma query', { query: e.query, duration: `${e.duration}ms` });
  });
}


if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}


export default prisma;