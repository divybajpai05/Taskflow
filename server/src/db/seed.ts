// src/db/debug-seed.ts
import { db } from "../db/drizzle";
import { roles, permissions, rolePermissions } from "../db/schema";
import { v4 as uuidv4 } from "uuid";
import "dotenv/config";

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
  "user_management",
  "workspaces",
  "activity_logs",
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

    // Don't check for existing data - just insert
    console.log("\nStep 5: Starting fresh insert...");

    // Clear existing data
    console.log("Clearing old data...");
    await db.delete(rolePermissions);
    await db.delete(permissions);
    await db.delete(roles);
    console.log("✅ Old data cleared");

    // Insert permissions one by one
    console.log("\nInserting permissions...");
    const permIds = new Map();
    let permCount = 0;

    for (const permName of ALL_PERMISSIONS) {
      const id = uuidv4();
      permIds.set(permName, id);

      await db.insert(permissions).values({
        id,
        name: permName,
        description: permName.toUpperCase(),
        module: "core",
      });

      permCount++;
      console.log(`  ✓ ${permCount}. ${permName}`);
    }
    console.log(`✅ Inserted ${permCount} permissions\n`);

    // Create Admin role
    console.log("Creating Admin role...");
    const adminRoleId = uuidv4();
    await db.insert(roles).values({
      id: adminRoleId,
      name: "Admin",
      description: "Administrator",
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

    // Create Employee role
    console.log("Creating Employee role...");
    const employeeRoleId = uuidv4();
    await db.insert(roles).values({
      id: employeeRoleId,
      name: "Employee",
      description: "Employee",
      isSystem: true,
    });

    const basicPerms = [
      "dashboard_access",
      "my_tasks",
      "kanban_board",
      "calendar",
    ];
    for (const permName of basicPerms) {
      const permId = permIds.get(permName);
      if (permId) {
        await db.insert(rolePermissions).values({
          roleId: employeeRoleId,
          permissionId: permId,
        });
      }
    }
    console.log(
      `✅ Employee role created with ${basicPerms.length} permissions\n`,
    );

    // Create Manager role
    console.log("Creating Manager role...");
    const managerRoleId = uuidv4();
    await db.insert(roles).values({
      id: managerRoleId,
      name: "Manager",
      description: "Manager",
      isSystem: true,
    });

    const managerPerms = [
      "dashboard_access",
      "my_tasks",
      "kanban_board",
      "calendar",
      "analytics",
      "team_management",
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

    // Create HR role
    console.log("Creating HR role...");
    const hrRoleId = uuidv4();
    await db.insert(roles).values({
      id: hrRoleId,
      name: "HR",
      description: "HR",
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
      "user_management",
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

    // Final verification
    console.log("Verifying final counts...");
    const finalRoles = await db.select().from(roles);
    const finalPerms = await db.select().from(permissions);
    const finalMappings = await db.select().from(rolePermissions);

    console.log("\n🎉 SEED COMPLETED SUCCESSFULLY!");
    console.log("================================");
    console.log(`Roles created: ${finalRoles.length}`);
    console.log(`Permissions created: ${finalPerms.length}`);
    console.log(`Role-Permission mappings: ${finalMappings.length}`);
    console.log("================================");
  } catch (error) {
    console.error("❌ SEED FAILED:", error);
  }

  process.exit(0);
}

// Execute immediately
console.log("Calling debugSeed function...");
debugSeed();
