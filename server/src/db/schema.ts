// src/db/schema.ts
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

// ==================== TABLES ====================

// Workspace Members (Junction Table - Multi-workspace support)
export const workspaceMembers = mysqlTable(
  "workspace_members",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`(UUID())`),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    workspaceId: varchar("workspace_id", { length: 36 })
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    roleId: varchar("role_id", { length: 36 })
      .notNull()
      .references(() => roles.id),
    teamId: varchar("team_id", { length: 36 }).references(() => teams.id, {
      onDelete: "set null",
    }),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
  },
  (table) => [
    unique("user_workspace_unique").on(table.userId, table.workspaceId),
    index("wm_user_idx").on(table.userId),
    index("wm_workspace_idx").on(table.workspaceId),
  ],
);

// Workspaces
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

// Roles
export const roles = mysqlTable("roles", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`(UUID())`),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  isSystem: boolean("is_system").default(false),
});

// Permissions
export const permissions = mysqlTable("permissions", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`(UUID())`),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  module: varchar("module", { length: 50 }),
});

// Role <-> Permission
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

// Users
export const users = mysqlTable("users", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`(UUID())`),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 150 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  password: text("password").notNull(),

  emailVerified: boolean("email_verified").default(false),
  emailVerificationToken: text("email_verification_token"),
  emailVerificationExpires: timestamp("email_verification_expires"),
  passwordResetToken: text("password_reset_token"),
  passwordResetExpires: timestamp("password_reset_expires"),
  refreshToken: text("refresh_token"),
  lastLoginAt: timestamp("last_login_at"),
  lastLoginIp: varchar("last_login_ip", { length: 45 }),

  avatar: varchar("avatar", { length: 500 }),
  employmentType: mysqlEnum("employment_type", [
    "Full-time",
    "Contract",
    "Remote",
  ]).default("Full-time"),
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
  description: text("description"),
  workspaceId: varchar("workspace_id", { length: 36 })
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  color: varchar("color", { length: 20 }),
});

// Tasks
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
      "ON_HOLD",
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

// Task Assignees
export const taskAssignees = mysqlTable(
  "task_assignees",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`(UUID())`),
    taskId: varchar("task_id", { length: 36 })
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (table) => [unique("task_user_unique").on(table.taskId, table.userId)],
);

// Activity Logs
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
    action: varchar("action", { length: 500 }).notNull(),
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
    workspaceId: varchar("workspace_id", { length: 36 })
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
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
  workspaceId: varchar("workspace_id", { length: 36 })
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  leaveTypeId: varchar("leave_type_id", { length: 36 })
    .notNull()
    .references(() => leaveTypes.id, { onDelete: "restrict" }),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: mysqlEnum("status", ["PENDING", "APPROVED", "REJECTED"]).default(
    "PENDING",
  ),
  reason: text("reason"),
  approvedById: varchar("approved_by_id", { length: 36 }).references(
    () => users.id,
  ),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// Leave Types
export const leaveTypes = mysqlTable("leave_types", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`(UUID())`),
  workspaceId: varchar("workspace_id", { length: 36 })
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 7 }).notNull().default("#3b82f6"),
  isPaid: boolean("is_paid").notNull().default(true),
  defaultDays: int("default_days").notNull().default(0),
  requiresApproval: boolean("requires_approval").notNull().default(true),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// Email Templates
export const emailTemplates = mysqlTable("email_templates", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`(UUID())`),
  name: varchar("name", { length: 100 }).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  body: text("body").notNull(),
  category: varchar("category", { length: 50 }).default("General"),
  isSystem: boolean("is_system").default(false),
  createdById: varchar("created_by_id", { length: 36 }).references(
    () => users.id,
  ),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Email Logs
export const emailLogs = mysqlTable(
  "email_logs",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`(UUID())`),
    workspaceId: varchar("workspace_id", { length: 36 })
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    senderId: varchar("sender_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    recipientEmail: varchar("recipient_email", { length: 255 }).notNull(),
    subject: varchar("subject", { length: 255 }).notNull(),
    status: varchar("status", { length: 20 }).default("sent"),
    sentAt: timestamp("sent_at").defaultNow().notNull(),
  },
  (table) => [
    index("email_logs_workspace_idx").on(table.workspaceId),
    index("email_logs_sender_idx").on(table.senderId),
    index("email_logs_status_idx").on(table.status),
    index("email_logs_sent_at_idx").on(table.sentAt),
  ],
);

// ==================== RELATIONS ====================

export const workspacesRelations = relations(workspaces, ({ many }) => ({
  members: many(workspaceMembers),
  teams: many(teams),
  tasks: many(tasks),
  activityLogs: many(activityLogs),
  leaveTypes: many(leaveTypes),
}));

export const usersRelations = relations(users, ({ many }) => ({
  workspaceMemberships: many(workspaceMembers),
  customPermissions: many(userPermissions),
  assignedTasks: many(taskAssignees),
  createdTasks: many(tasks, { relationName: "TaskCreator" }),
  activityLogs: many(activityLogs),
  attendance: many(attendance),
  leaves: many(leaves),
  sentEmails: many(emailLogs, { relationName: "EmailSender" }),
}));

export const workspaceMembersRelations = relations(
  workspaceMembers,
  ({ one }) => ({
    user: one(users, {
      fields: [workspaceMembers.userId],
      references: [users.id],
    }),
    workspace: one(workspaces, {
      fields: [workspaceMembers.workspaceId],
      references: [workspaces.id],
    }),
    role: one(roles, {
      fields: [workspaceMembers.roleId],
      references: [roles.id],
    }),
    team: one(teams, {
      fields: [workspaceMembers.teamId],
      references: [teams.id],
    }),
  }),
);

export const rolesRelations = relations(roles, ({ many }) => ({
  workspaceMembers: many(workspaceMembers),
  rolePermissions: many(rolePermissions),
}));

export const teamsRelations = relations(teams, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [teams.workspaceId],
    references: [workspaces.id],
  }),
  members: many(workspaceMembers),
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
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
  assignees: many(taskAssignees),
}));

export const taskAssigneesRelations = relations(taskAssignees, ({ one }) => ({
  task: one(tasks, { fields: [taskAssignees.taskId], references: [tasks.id] }),
  user: one(users, { fields: [taskAssignees.userId], references: [users.id] }),
}));

export const attendanceRelations = relations(attendance, ({ one }) => ({
  user: one(users, { fields: [attendance.userId], references: [users.id] }),
  workspace: one(workspaces, {
    fields: [attendance.workspaceId],
    references: [workspaces.id],
  }),
  markedBy: one(users, {
    fields: [attendance.markedById],
    references: [users.id],
    relationName: "AttendanceMarker",
  }),
}));

export const leavesRelations = relations(leaves, ({ one }) => ({
  user: one(users, { fields: [leaves.userId], references: [users.id] }),
  workspace: one(workspaces, {
    fields: [leaves.workspaceId],
    references: [workspaces.id],
  }),
  leaveType: one(leaveTypes, {
    fields: [leaves.leaveTypeId],
    references: [leaveTypes.id],
  }),
  approvedBy: one(users, {
    fields: [leaves.approvedById],
    references: [users.id],
    relationName: "LeaveApprover",
  }),
}));

export const leaveTypesRelations = relations(leaveTypes, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [leaveTypes.workspaceId],
    references: [workspaces.id],
  }),
  leaves: many(leaves),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  user: one(users, { fields: [activityLogs.userId], references: [users.id] }),
  workspace: one(workspaces, {
    fields: [activityLogs.workspaceId],
    references: [workspaces.id],
  }),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
  userPermissions: many(userPermissions),
}));

export const rolePermissionsRelations = relations(
  rolePermissions,
  ({ one }) => ({
    role: one(roles, {
      fields: [rolePermissions.roleId],
      references: [roles.id],
    }),
    permission: one(permissions, {
      fields: [rolePermissions.permissionId],
      references: [permissions.id],
    }),
  }),
);

export const userPermissionsRelations = relations(
  userPermissions,
  ({ one }) => ({
    user: one(users, {
      fields: [userPermissions.userId],
      references: [users.id],
    }),
    permission: one(permissions, {
      fields: [userPermissions.permissionId],
      references: [permissions.id],
    }),
  }),
);

export const emailTemplatesRelations = relations(emailTemplates, ({ one }) => ({
  createdBy: one(users, {
    fields: [emailTemplates.createdById],
    references: [users.id],
  }),
}));

export const emailLogsRelations = relations(emailLogs, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [emailLogs.workspaceId],
    references: [workspaces.id],
  }),
  sender: one(users, {
    fields: [emailLogs.senderId],
    references: [users.id],
    relationName: "EmailSender",
  }),
}));
