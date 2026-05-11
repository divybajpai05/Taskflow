"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// scripts/reset-db.ts
const promise_1 = __importDefault(require("mysql2/promise"));
require("dotenv/config");
async function resetDatabase() {
    console.log("🗑️ Connecting to database...");
    const connection = await promise_1.default.createConnection({
        uri: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
    });
    console.log("✅ Connected. Dropping all tables...");
    // Disable foreign key checks
    await connection.execute(`SET FOREIGN_KEY_CHECKS = 0`);
    // Drop tables one by one in correct order (child tables first)
    const tables = [
        "activity_logs",
        "attendance",
        "leaves",
        "email_templates",
        "tasks",
        "user_permissions",
        "role_permissions",
        "permissions",
        "users",
        "teams",
        "roles",
        "workspaces",
    ];
    for (const table of tables) {
        try {
            await connection.execute(`DROP TABLE IF EXISTS ${table}`);
            console.log(`  ✓ Dropped ${table}`);
        }
        catch (error) {
            console.log(`  ⚠️ Failed to drop ${table}: ${error.message}`);
        }
    }
    // Re-enable foreign key checks
    await connection.execute(`SET FOREIGN_KEY_CHECKS = 1`);
    console.log("✅ All tables dropped successfully!");
    await connection.end();
    process.exit(0);
}
resetDatabase().catch((error) => {
    console.error("❌ Failed:", error);
    process.exit(1);
});
