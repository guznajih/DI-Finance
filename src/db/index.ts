import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

// Add global connection pool caching to persist across hot-reloads
declare global {
  var _postgresPool: Pool | undefined;
}

// Function to create or retrieve the connection pool.
export const createPool = () => {
  if (!global._postgresPool) {
    global._postgresPool = new Pool({
      host: process.env.SQL_HOST,
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      database: process.env.SQL_DB_NAME,
      max: 5,
      idleTimeoutMillis: 5000,
      connectionTimeoutMillis: 15000,
    });

    // Prevent unhandled pool-level errors from crashing the application.
    // Cloud SQL scale-to-zero / developer proxy routinely closes idle sockets with 57P01.
    global._postgresPool.on('error', (err: any) => {
      const msg = err?.message || '';
      if (
        err?.code === '57P01' ||
        msg.includes('terminating connection due to administrator command') ||
        msg.includes('Connection terminated unexpectedly')
      ) {
        // Expected idle teardown; node-postgres removes the client from pool cleanly.
        return;
      }
      console.warn('SQL pool notice:', msg);
    });
  }
  return global._postgresPool;
};

// Create or retrieve the pool instance.
export const pool = createPool();

// Initialize Drizzle with the pool and schema.
export const db = drizzle(pool, { schema });
