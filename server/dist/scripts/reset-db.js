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
    // Drop tables in correct order (child tables first, parents last)
    // Tables with foreign keys referencing other tables must be dropped first
    const tables = [
        // Email logs
        "email_logs",
        // Activity and audit
        "activity_logs",
        // Task-related
        "task_assignees",
        "tasks",
        // Attendance and leaves
        "attendance",
        "leaves",
        "leave_types",
        // Permissions
        "user_permissions",
        "role_permissions",
        "permissions",
        // Email templates
        "email_templates",
        // Users and workspace members
        "workspace_members",
        "users",
        // Organization structure
        "teams",
        "roles",
        // Top-level
        "workspaces",
    ];
    for (const table of tables) {
        try {
            await connection.execute(`DROP TABLE IF EXISTS \`${table}\``);
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
