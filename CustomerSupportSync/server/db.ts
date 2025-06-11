// Cast to any to avoid TypeScript issues when switching between
// MySQL and SQLite implementations at runtime.
export const db: any = dbInstance;
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from '../shared/schema';

// Required for Neon database on Node.js
neonConfig.webSocketConstructor = ws;

// Check if the DATABASE_URL environment variable is set
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Create a connection pool
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Create a drizzle client
export const db = drizzle(pool, { schema });

console.log('Database connection established successfully');
