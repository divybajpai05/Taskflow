import {
  mysqlTable,
  varchar,
  text,
  timestamp,
  boolean,
  mysqlEnum,
  json,
  index,
  unique,
  primaryKey,
  int,
} from "drizzle-orm/mysql-core";
import { relations, sql } from "drizzle-orm";
import { bigint } from "drizzle-orm/mysql-core";

// ------------------- Tables -------------------

// Core: Workspace (multi-tenant) - Very good for Taskflow
export const workspaces = mysqlTable("workspaces", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`(UUID())`),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  ownerId: varchar("owner_id", { length: 36 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Roles (RBAC foundation)
export const roles = mysqlTable("roles", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`(UUID())`),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  isSystem: boolean("is_system").default(false),
});

// Permissions (fine-grained control)
export const permissions = mysqlTable("permissions", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`(UUID())`),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  module: varchar("module", { length: 50 }), // "tasks", "users", "hr", etc.
});

// Role <-> Permission (many-to-many)
export const rolePermissions = mysqlTable(
  "role_permissions",
  {
    roleId: varchar("role_id", { length: 36 })
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    permissionId: varchar("permission_id", { length: 36 })
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.roleId, table.permissionId] })],
);

// User-level permission overrides
export const userPermissions = mysqlTable(
  "user_permissions",
  {
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    permissionId: varchar("permission_id", { length: 36 })
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
    granted: boolean("granted").default(true),
  },
  (table) => [primaryKey({ columns: [table.userId, table.permissionId] })],
);

// Users Table (Core for Authentication)
export const users = mysqlTable("users", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`(UUID())`),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 150 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  password: text("password").notNull(), // hashed with argon2

  emailVerified: boolean("email_verified").default(false),
  emailVerificationToken: text("email_verification_token"),
  emailVerificationExpires: timestamp("email_verification_expires"),
  passwordResetToken: text("password_reset_token"),
  passwordResetExpires: timestamp("password_reset_expires"),
  refreshToken: text("refresh_token"), // Store hashed refresh token for rotation
  lastLoginAt: timestamp("last_login_at"),
  lastLoginIp: varchar("last_login_ip", { length: 45 }),

  avatar: varchar("avatar", { length: 500 }),
  roleId: varchar("role_id", { length: 36 })
    .notNull()
    .references(() => roles.id),
  workspaceId: varchar("workspace_id", { length: 36 })
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  team: varchar("team", { length: 100 }),
  teamId: varchar("team_id", { length: 36 }).references(() => teams.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Teams
export const teams = mysqlTable("teams", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`(UUID())`),
  name: varchar("name", { length: 150 }).notNull(),
  workspaceId: varchar("workspace_id", { length: 36 })
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  color: varchar("color", { length: 20 }),
});

// Tasks (Main feature of Taskflow)
export const tasks = mysqlTable(
  "tasks",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`(UUID())`),
    title: varchar("title", { length: 500 }).notNull(),
    description: text("description"),
    status: mysqlEnum("status", [
      "TODO",
      "IN_PROGRESS",
      "REVIEW",
      "DONE",
      "CANCELLED",
    ]).default("TODO"),
    priority: mysqlEnum("priority", [
      "LOW",
      "MEDIUM",
      "HIGH",
      "URGENT",
    ]).default("MEDIUM"),
    dueDate: timestamp("due_date"),
    workspaceId: varchar("workspace_id", { length: 36 })
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    teamId: varchar("team_id", { length: 36 }).references(() => teams.id),
    assigneeId: varchar("assignee_id", { length: 36 }).references(
      () => users.id,
    ),
    createdById: varchar("created_by_id", { length: 36 })
      .notNull()
      .references(() => users.id),
    updatedById: varchar("updated_by_id", { length: 36 }).references(
      () => users.id,
    ),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  },
  (table) => [
    index("tasks_workspace_idx").on(table.workspaceId),
    index("tasks_assignee_idx").on(table.assigneeId),
    index("tasks_status_idx").on(table.status),
  ],
);

// Activity Logs (Audit trail - highly recommended)
export const activityLogs = mysqlTable(
  "activity_logs",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => users.id),
    workspaceId: varchar("workspace_id", { length: 36 }).references(
      () => workspaces.id,
    ),
    action: varchar("action", { length: 100 }).notNull(),
    entityType: varchar("entity_type", { length: 50 }),
    entityId: varchar("entity_id", { length: 36 }),
    details: json("details"),
    ipAddress: varchar("ip_address", { length: 45 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("activity_user_idx").on(table.userId),
    index("activity_workspace_idx").on(table.workspaceId),
    index("activity_created_idx").on(table.createdAt),
  ],
);

// Attendance
export const attendance = mysqlTable(
  "attendance",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`(UUID())`),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => users.id),
    date: timestamp("date").notNull(),
    status: mysqlEnum("status", [
      "PRESENT",
      "LATE",
      "ABSENT",
      "HALF_DAY",
      "ON_LEAVE",
    ]).notNull(),
    markedById: varchar("marked_by_id", { length: 36 }).references(
      () => users.id,
    ),
    notes: text("notes"),
  },
  (table) => [
    unique("attendance_user_date_unique").on(table.userId, table.date),
  ],
);

// Leaves
export const leaves = mysqlTable("leaves", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`(UUID())`),
  userId: varchar("user_id", { length: 36 })
    .notNull()
    .references(() => users.id),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  type: mysqlEnum("type", ["CASUAL", "SICK", "EARNED", "UNPAID"]).notNull(),
  status: mysqlEnum("status", ["PENDING", "APPROVED", "REJECTED"]).default(
    "PENDING",
  ),
  reason: text("reason"),
  approvedById: varchar("approved_by_id", { length: 36 }).references(
    () => users.id,
  ),
});

// Email Templates
export const emailTemplates = mysqlTable("email_templates", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`(UUID())`),
  name: varchar("name", { length: 100 }).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  body: text("body").notNull(),
  isSystem: boolean("is_system").default(false),
  createdById: varchar("created_by_id", { length: 36 }).references(
    () => users.id,
  ),
});

// ------------------- Relations -------------------
export const workspacesRelations = relations(workspaces, ({ many }) => ({
  users: many(users),
  teams: many(teams),
  tasks: many(tasks),
  activityLogs: many(activityLogs),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  role: one(roles, { fields: [users.roleId], references: [roles.id] }),
  workspace: one(workspaces, {
    fields: [users.workspaceId],
    references: [workspaces.id],
  }),
  team: one(teams, { fields: [users.teamId], references: [teams.id] }),
  customPermissions: many(userPermissions),
  assignedTasks: many(tasks, { relationName: "TaskAssignee" }),
  createdTasks: many(tasks, { relationName: "TaskCreator" }),
  activityLogs: many(activityLogs),
  attendance: many(attendance),
  leaves: many(leaves),
}));

// Add other relations as needed (roles, permissions, tasks, etc.)

export const tasksRelations = relations(tasks, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [tasks.workspaceId],
    references: [workspaces.id],
  }),
  team: one(teams, { fields: [tasks.teamId], references: [teams.id] }),
  assignee: one(users, {
    fields: [tasks.assigneeId],
    references: [users.id],
    relationName: "TaskAssignee",
  }),
  creator: one(users, {
    fields: [tasks.createdById],
    references: [users.id],
    relationName: "TaskCreator",
  }),
}));

// You can export everything
export * from "./schema";
