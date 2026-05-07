// src/db/seed.ts
import { db } from "./drizzle";
import { roles, permissions, rolePermissions } from "./schema";
import { v4 as uuidv4 } from "uuid";
import "dotenv/config";
import { eq } from "drizzle-orm";

console.log("🚀 Seeder starting...");

const ALL_PERMISSIONS = [
  // Dashboard & Tasks
  "dashboard_access",
  "my_tasks",
  "kanban_board",
  "calendar",

  // HR Module
  "hr_dashboard",
  "attendance",
  "leave_management",
  "leave_type_management", // ✅ ADDED for leave type management
  "hr_calendar",

  // Communication
  "email_center",

  // Teams
  "team_management",

  // Analytics
  "analytics",

  // Admin (restricted)
  "user_management",
  "workspaces",
  "role_management",
  "activity_logs",
];

async function seed() {
  console.log("Testing database connection...");

  try {
    // Test connection
    const testResult = await db.select().from(roles).limit(1);
    console.log("Database connected, current roles:", testResult.length);

    // Clear existing data in correct order (child tables first)
    console.log("\nClearing old data...");
    await db.delete(rolePermissions);
    await db.delete(permissions);
    await db.delete(roles);
    console.log("✅ Old data cleared");

    // =========================================
    // Insert ALL permissions
    // =========================================
    console.log("\nInserting permissions...");
    const permIds = new Map<string, string>();

    for (const permName of ALL_PERMISSIONS) {
      const id = uuidv4();
      permIds.set(permName, id);

      await db.insert(permissions).values({
        id,
        name: permName,
        description: permName.replace(/_/g, " ").toUpperCase(),
        module: getModuleForPermission(permName),
      });

      console.log(`  ✓ ${permName}`);
    }
    console.log(`✅ Inserted ${ALL_PERMISSIONS.length} permissions\n`);

    // =========================================
    // ✅ ADMIN ROLE - ALL permissions
    // =========================================
    console.log("Creating Admin role...");
    const adminRoleId = uuidv4();
    await db.insert(roles).values({
      id: adminRoleId,
      name: "Admin",
      description: "Administrator with full access",
      isSystem: true,
    });

    for (const [permName, permId] of permIds) {
      await db.insert(rolePermissions).values({
        roleId: adminRoleId,
        permissionId: permId,
      });
    }
    console.log(
      `✅ Admin role created with ALL ${ALL_PERMISSIONS.length} permissions\n`,
    );

    // =========================================
    // ✅ HR ROLE - HR + Team Management + Leave Type Management
    // =========================================
    console.log("Creating HR role...");
    const hrRoleId = uuidv4();
    await db.insert(roles).values({
      id: hrRoleId,
      name: "HR",
      description: "HR Manager with HR module access",
      isSystem: true,
    });

    const hrPerms = [
      "dashboard_access",
      "my_tasks",
      "kanban_board",
      "calendar",
      "hr_dashboard",
      "attendance",
      "leave_management",
      "leave_type_management", // ✅ HR can manage leave types
      "hr_calendar",
      "email_center",
      "team_management",
      "analytics",
      "activity_logs",
    ];

    for (const permName of hrPerms) {
      const permId = permIds.get(permName);
      if (permId) {
        await db.insert(rolePermissions).values({
          roleId: hrRoleId,
          permissionId: permId,
        });
      }
    }
    console.log(`✅ HR role created with ${hrPerms.length} permissions\n`);

    // =========================================
    // ✅ MANAGER ROLE - Team Management + Basic access
    // =========================================
    console.log("Creating Manager role...");
    const managerRoleId = uuidv4();
    await db.insert(roles).values({
      id: managerRoleId,
      name: "Manager",
      description: "Team Manager with team-level access",
      isSystem: true,
    });

    const managerPerms = [
      "dashboard_access",
      "my_tasks",
      "kanban_board",
      "calendar",
      "analytics",
      "team_management",
      "activity_logs",
    ];

    for (const permName of managerPerms) {
      const permId = permIds.get(permName);
      if (permId) {
        await db.insert(rolePermissions).values({
          roleId: managerRoleId,
          permissionId: permId,
        });
      }
    }
    console.log(
      `✅ Manager role created with ${managerPerms.length} permissions\n`,
    );

    // =========================================
    // ✅ EMPLOYEE ROLE - Basic access only
    // =========================================
    console.log("Creating Employee role...");
    const employeeRoleId = uuidv4();
    await db.insert(roles).values({
      id: employeeRoleId,
      name: "Employee",
      description: "Regular Employee with basic access",
      isSystem: true,
    });

    const employeePerms = [
      "dashboard_access",
      "my_tasks",
      "kanban_board",
      "calendar",
      "activity_logs",
    ];

    for (const permName of employeePerms) {
      const permId = permIds.get(permName);
      if (permId) {
        await db.insert(rolePermissions).values({
          roleId: employeeRoleId,
          permissionId: permId,
        });
      }
    }
    console.log(
      `✅ Employee role created with ${employeePerms.length} permissions\n`,
    );

    // =========================================
    // Final verification
    // =========================================
    console.log("\n📊 ================================");
    console.log("   PERMISSION MATRIX SUMMARY");
    console.log("================================\n");

    const finalRoles = await db.select().from(roles);
    const finalPerms = await db.select().from(permissions);
    const finalMappings = await db.select().from(rolePermissions);

    console.log(`Roles created: ${finalRoles.length}`);
    console.log(`Permissions created: ${finalPerms.length}`);
    console.log(`Role-Permission mappings: ${finalMappings.length}`);
    console.log("");

    for (const role of finalRoles) {
      const rolePermList = await db
        .select({ name: permissions.name })
        .from(rolePermissions)
        .innerJoin(
          permissions,
          eq(rolePermissions.permissionId, permissions.id),
        )
        .where(eq(rolePermissions.roleId, role.id));

      console.log(`📋 ${role.name} (${rolePermList.length} permissions):`);
      console.log(`   ${rolePermList.map((p: any) => p.name).join(", ")}`);
      console.log("");
    }

    console.log("🎉 SEED COMPLETED SUCCESSFULLY!");
    console.log("================================\n");

    console.log("📋 Permission Matrix:");
    console.log(
      "┌──────────┬──────────────────────────────────────────────────────┐",
    );
    console.log(
      "│ Role     │ Permissions                                           │",
    );
    console.log(
      "├──────────┼──────────────────────────────────────────────────────┤",
    );
    console.log(
      "│ Admin    │ ALL permissions                                       │",
    );
    console.log(
      "│ HR       │ dashboard, tasks, kanban, calendar, HR module,      │",
    );
    console.log(
      "│          │ leave_type_management, team_management, analytics   │",
    );
    console.log(
      "│ Manager  │ dashboard, tasks, kanban, calendar, analytics,      │",
    );
    console.log(
      "│          │ team_management, activity_logs                      │",
    );
    console.log(
      "│ Employee │ dashboard, tasks, kanban, calendar, activity_logs   │",
    );
    console.log(
      "└──────────┴──────────────────────────────────────────────────────┘",
    );
  } catch (error) {
    console.error("❌ SEED FAILED:", error);
  }

  process.exit(0);
}

function getModuleForPermission(permission: string): string {
  if (
    permission.startsWith("hr_") ||
    ["attendance", "leave_management", "leave_type_management"].includes(
      permission,
    )
  )
    return "hr";
  if (
    [
      "user_management",
      "workspaces",
      "role_management",
      "activity_logs",
    ].includes(permission)
  )
    return "admin";
  if (["my_tasks", "kanban_board", "calendar"].includes(permission))
    return "tasks";
  if (permission === "team_management") return "teams";
  if (permission === "email_center") return "communication";
  if (permission === "analytics") return "analytics";
  return "general";
}

console.log("Calling seed function...");
seed();
