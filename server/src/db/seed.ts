// src/db/debug-seed.ts
import { db } from "./drizzle"; // ✅ Fixed: ./drizzle (same folder)
import { roles, permissions, rolePermissions } from "./schema"; // ✅ Fixed: ./schema
import { v4 as uuidv4 } from "uuid";
import "dotenv/config";
import { eq } from "drizzle-orm";

console.log("🚀 Seeder starting...");
console.log("Step 1: Imports loaded");

const ALL_PERMISSIONS = [
  "dashboard_access",
  "my_tasks",
  "kanban_board",
  "calendar",
  "analytics",
  "hr_dashboard",
  "attendance",
  "leave_management",
  "hr_calendar",
  "email_center",
  "team_management",
  "user_management", // ✅ Admin ONLY
  "workspaces", // ✅ Admin ONLY
  "activity_logs", // ✅ Everyone
];

async function debugSeed() {
  console.log("Step 2: Function started");

  try {
    // Test database connection
    console.log("Step 3: Testing database connection...");
    const testResult = await db.select().from(roles).limit(1);
    console.log(
      "Step 4: Database connected, current roles:",
      testResult.length,
    );

    // Clear existing data
    console.log("\nClearing old data...");
    await db.delete(rolePermissions);
    await db.delete(permissions);
    await db.delete(roles);
    console.log("✅ Old data cleared");

    // Insert permissions
    console.log("\nInserting permissions...");
    const permIds = new Map();
    let permCount = 0;

    for (const permName of ALL_PERMISSIONS) {
      const id = uuidv4();
      permIds.set(permName, id);

      await db.insert(permissions).values({
        id,
        name: permName,
        description: permName.replace(/_/g, " ").toUpperCase(),
        module: "core",
      });

      permCount++;
      console.log(`  ✓ ${permCount}. ${permName}`);
    }
    console.log(`✅ Inserted ${permCount} permissions\n`);

    // =========================================
    // ✅ Admin Role - ALL permissions
    // =========================================
    console.log("Creating Admin role...");
    const adminRoleId = uuidv4();
    await db.insert(roles).values({
      id: adminRoleId,
      name: "Admin",
      description: "Administrator with full access",
      isSystem: true,
    });

    let mappingCount = 0;
    for (const [permName, permId] of permIds) {
      await db.insert(rolePermissions).values({
        roleId: adminRoleId,
        permissionId: permId,
      });
      mappingCount++;
    }
    console.log(`✅ Admin role created with ${mappingCount} permissions\n`);

    // =========================================
    // ✅ HR Role - NO user_management, NO workspaces
    // =========================================
    console.log("Creating HR role...");
    const hrRoleId = uuidv4();
    await db.insert(roles).values({
      id: hrRoleId,
      name: "HR",
      description: "HR Manager",
      isSystem: true,
    });

    const hrPerms = [
      "dashboard_access",
      "my_tasks",
      "calendar",
      "hr_dashboard",
      "attendance",
      "leave_management",
      "hr_calendar",
      "email_center",
      "team_management",
      "activity_logs", // ✅ Added
      // ❌ user_management REMOVED
      // ❌ workspaces REMOVED
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
    // ✅ Manager Role
    // =========================================
    console.log("Creating Manager role...");
    const managerRoleId = uuidv4();
    await db.insert(roles).values({
      id: managerRoleId,
      name: "Manager",
      description: "Team Manager",
      isSystem: true,
    });

    const managerPerms = [
      "dashboard_access",
      "my_tasks",
      "kanban_board",
      "calendar",
      "analytics",
      "team_management",
      "activity_logs", // ✅ Added
      // ❌ user_management REMOVED
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
    // ✅ Employee Role
    // =========================================
    console.log("Creating Employee role...");
    const employeeRoleId = uuidv4();
    await db.insert(roles).values({
      id: employeeRoleId,
      name: "Employee",
      description: "Regular Employee",
      isSystem: true,
    });

    const employeePerms = [
      "dashboard_access",
      "my_tasks",
      "kanban_board",
      "calendar",
      "activity_logs", // ✅ Added
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

    // Show each role's permissions
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
    console.log("================================");
  } catch (error) {
    console.error("❌ SEED FAILED:", error);
  }

  process.exit(0);
}

// Execute
console.log("Calling debugSeed function...");
debugSeed();
