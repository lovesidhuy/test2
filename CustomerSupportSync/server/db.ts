import mysql from 'mysql2/promise';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/mysql2';
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';
import * as schema from '../shared/schema';

let dbInstance: ReturnType<typeof drizzle> | ReturnType<typeof drizzleSqlite>;

if (process.env.DATABASE_URL) {
  // MySQL connection for production or if a URL is provided
  const pool = mysql.createPool(process.env.DATABASE_URL);
  dbInstance = drizzle(pool, { schema, mode: 'default' });
  console.log('MySQL connection established');
} else {
  // Fallback to in-memory SQLite for quick start in development
  const sqlite = new Database(':memory:');
  dbInstance = drizzleSqlite(sqlite, { schema, mode: 'default' });
  console.log('Using in-memory SQLite database');
}

export const db = dbInstance;
