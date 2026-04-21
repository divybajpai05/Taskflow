import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

// Create a connection pool
const poolConnection = mysql.createPool(process.env.DATABASE_URL!);

// Initialise Drizzle
export const db = drizzle(poolConnection, { schema, mode: "default" });

// Test connection
export async function testConnection() {
  try {
    await poolConnection.query("SELECT 1");
    console.log("✅ Database connected successfully!");
  } catch (error) {
    console.error("❌ Database connection failed:", error);
  }
}
