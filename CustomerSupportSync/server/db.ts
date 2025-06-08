import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from '../shared/schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

export const pool = mysql.createPool(process.env.DATABASE_URL);
// Drizzle requires specifying the query builder mode when using a schema
export const db = drizzle(pool, { schema, mode: 'default' });

console.log('MySQL connection established');
