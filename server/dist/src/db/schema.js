"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailLogs = exports.tasksRelations = exports.usersRelations = exports.workspacesRelations = exports.emailTemplates = exports.leaves = exports.attendance = exports.activityLogs = exports.taskAssignees = exports.tasks = exports.teams = exports.users = exports.userPermissions = exports.rolePermissions = exports.permissions = exports.roles = exports.workspaces = exports.workspaceMembers = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const drizzle_orm_1 = require("drizzle-orm");
const mysql_core_2 = require("drizzle-orm/mysql-core");
// ------------------- Tables -------------------
// src/db/schema.ts
// ✅ ADD this new table
exports.workspaceMembers = (0, mysql_core_1.mysqlTable)("workspace_members", {
    id: (0, mysql_core_1.varchar)("id", { length: 36 })
        .primaryKey()
        .default((0, drizzle_orm_1.sql) `(UUID())`),
    userId: (0, mysql_core_1.varchar)("user_id", { length: 36 })
        .notNull()
        .references(() => exports.users.id, { onDelete: "cascade" }),
    workspaceId: (0, mysql_core_1.varchar)("workspace_id", { length: 36 })
        .notNull()
        .references(() => exports.workspaces.id, { onDelete: "cascade" }),
    roleId: (0, mysql_core_1.varchar)("role_id", { length: 36 })
        .notNull()
        .references(() => exports.roles.id),
    teamId: (0, mysql_core_1.varchar)("team_id", { length: 36 }).references(() => exports.teams.id, {
        onDelete: "set null",
    }),
    joinedAt: (0, mysql_core_1.timestamp)("joined_at").defaultNow().notNull(),
}, (table) => [
    (0, mysql_core_1.unique)("user_workspace_unique").on(table.userId, table.workspaceId),
    (0, mysql_core_1.index)("workspace_members_user_idx").on(table.userId),
    (0, mysql_core_1.index)("workspace_members_workspace_idx").on(table.workspaceId),
]);
// Core: Workspace (multi-tenant) - Very good for Taskflow
exports.workspaces = (0, mysql_core_1.mysqlTable)("workspaces", {
    id: (0, mysql_core_1.varchar)("id", { length: 36 })
        .primaryKey()
        .default((0, drizzle_orm_1.sql) `(UUID())`),
    name: (0, mysql_core_1.varchar)("name", { length: 255 }).notNull(),
    description: (0, mysql_core_1.text)("description"),
    ownerId: (0, mysql_core_1.varchar)("owner_id", { length: 36 }),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow().notNull(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow(),
});
// Roles (RBAC foundation)
exports.roles = (0, mysql_core_1.mysqlTable)("roles", {
    id: (0, mysql_core_1.varchar)("id", { length: 36 })
        .primaryKey()
        .default((0, drizzle_orm_1.sql) `(UUID())`),
    name: (0, mysql_core_1.varchar)("name", { length: 100 }).notNull().unique(),
    description: (0, mysql_core_1.text)("description"),
    isSystem: (0, mysql_core_1.boolean)("is_system").default(false),
});
// Permissions (fine-grained control)
exports.permissions = (0, mysql_core_1.mysqlTable)("permissions", {
    id: (0, mysql_core_1.varchar)("id", { length: 36 })
        .primaryKey()
        .default((0, drizzle_orm_1.sql) `(UUID())`),
    name: (0, mysql_core_1.varchar)("name", { length: 100 }).notNull().unique(),
    description: (0, mysql_core_1.text)("description"),
    module: (0, mysql_core_1.varchar)("module", { length: 50 }), // "tasks", "users", "hr", etc.
});
// Role <-> Permission (many-to-many)
exports.rolePermissions = (0, mysql_core_1.mysqlTable)("role_permissions", {
    roleId: (0, mysql_core_1.varchar)("role_id", { length: 36 })
        .notNull()
        .references(() => exports.roles.id, { onDelete: "cascade" }),
    permissionId: (0, mysql_core_1.varchar)("permission_id", { length: 36 })
        .notNull()
        .references(() => exports.permissions.id, { onDelete: "cascade" }),
}, (table) => [(0, mysql_core_1.primaryKey)({ columns: [table.roleId, table.permissionId] })]);
// User-level permission overrides
exports.userPermissions = (0, mysql_core_1.mysqlTable)("user_permissions", {
    userId: (0, mysql_core_1.varchar)("user_id", { length: 36 })
        .notNull()
        .references(() => exports.users.id, { onDelete: "cascade" }),
    permissionId: (0, mysql_core_1.varchar)("permission_id", { length: 36 })
        .notNull()
        .references(() => exports.permissions.id, { onDelete: "cascade" }),
    granted: (0, mysql_core_1.boolean)("granted").default(true),
}, (table) => [(0, mysql_core_1.primaryKey)({ columns: [table.userId, table.permissionId] })]);
// Users Table (Core for Authentication)
exports.users = (0, mysql_core_1.mysqlTable)("users", {
    id: (0, mysql_core_1.varchar)("id", { length: 36 })
        .primaryKey()
        .default((0, drizzle_orm_1.sql) `(UUID())`),
    email: (0, mysql_core_1.varchar)("email", { length: 255 }).notNull().unique(),
    name: (0, mysql_core_1.varchar)("name", { length: 150 }).notNull(),
    phone: (0, mysql_core_1.varchar)("phone", { length: 20 }),
    password: (0, mysql_core_1.text)("password").notNull(), // hashed with argon2
    emailVerified: (0, mysql_core_1.boolean)("email_verified").default(false),
    emailVerificationToken: (0, mysql_core_1.text)("email_verification_token"),
    emailVerificationExpires: (0, mysql_core_1.timestamp)("email_verification_expires"),
    passwordResetToken: (0, mysql_core_1.text)("password_reset_token"),
    passwordResetExpires: (0, mysql_core_1.timestamp)("password_reset_expires"),
    refreshToken: (0, mysql_core_1.text)("refresh_token"), // Store hashed refresh token for rotation
    lastLoginAt: (0, mysql_core_1.timestamp)("last_login_at"),
    lastLoginIp: (0, mysql_core_1.varchar)("last_login_ip", { length: 45 }),
    avatar: (0, mysql_core_1.varchar)("avatar", { length: 500 }),
    roleId: (0, mysql_core_1.varchar)("role_id", { length: 36 })
        .notNull()
        .references(() => exports.roles.id),
    workspaceId: (0, mysql_core_1.varchar)("workspace_id", { length: 36 })
        .notNull()
        .references(() => exports.workspaces.id, { onDelete: "cascade" }),
    team: (0, mysql_core_1.varchar)("team", { length: 100 }),
    teamId: (0, mysql_core_1.varchar)("team_id", { length: 36 }).references(() => exports.teams.id),
    isActive: (0, mysql_core_1.boolean)("is_active").default(true),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow().notNull(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow(),
});
// Teams
exports.teams = (0, mysql_core_1.mysqlTable)("teams", {
    id: (0, mysql_core_1.varchar)("id", { length: 36 })
        .primaryKey()
        .default((0, drizzle_orm_1.sql) `(UUID())`),
    name: (0, mysql_core_1.varchar)("name", { length: 150 }).notNull(),
    description: (0, mysql_core_1.text)("description"),
    workspaceId: (0, mysql_core_1.varchar)("workspace_id", { length: 36 })
        .notNull()
        .references(() => exports.workspaces.id, { onDelete: "cascade" }),
    color: (0, mysql_core_1.varchar)("color", { length: 20 }),
});
// Tasks (Main feature of Taskflow)
exports.tasks = (0, mysql_core_1.mysqlTable)("tasks", {
    id: (0, mysql_core_1.varchar)("id", { length: 36 })
        .primaryKey()
        .default((0, drizzle_orm_1.sql) `(UUID())`),
    title: (0, mysql_core_1.varchar)("title", { length: 500 }).notNull(),
    description: (0, mysql_core_1.text)("description"),
    status: (0, mysql_core_1.mysqlEnum)("status", [
        "TODO",
        "IN_PROGRESS",
        "REVIEW",
        "DONE",
        "CANCELLED",
        "ON_HOLD",
    ]).default("TODO"),
    priority: (0, mysql_core_1.mysqlEnum)("priority", [
        "LOW",
        "MEDIUM",
        "HIGH",
        "URGENT",
    ]).default("MEDIUM"),
    dueDate: (0, mysql_core_1.timestamp)("due_date"),
    workspaceId: (0, mysql_core_1.varchar)("workspace_id", { length: 36 })
        .notNull()
        .references(() => exports.workspaces.id, { onDelete: "cascade" }),
    teamId: (0, mysql_core_1.varchar)("team_id", { length: 36 }).references(() => exports.teams.id),
    assigneeId: (0, mysql_core_1.varchar)("assignee_id", { length: 36 }).references(() => exports.users.id),
    createdById: (0, mysql_core_1.varchar)("created_by_id", { length: 36 })
        .notNull()
        .references(() => exports.users.id),
    updatedById: (0, mysql_core_1.varchar)("updated_by_id", { length: 36 }).references(() => exports.users.id),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow().notNull(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow(),
}, (table) => [
    (0, mysql_core_1.index)("tasks_workspace_idx").on(table.workspaceId),
    (0, mysql_core_1.index)("tasks_assignee_idx").on(table.assigneeId),
    (0, mysql_core_1.index)("tasks_status_idx").on(table.status),
]);
exports.taskAssignees = (0, mysql_core_1.mysqlTable)("task_assignees", {
    id: (0, mysql_core_1.varchar)("id", { length: 36 })
        .primaryKey()
        .default((0, drizzle_orm_1.sql) `(UUID())`),
    taskId: (0, mysql_core_1.varchar)("task_id", { length: 36 })
        .notNull()
        .references(() => exports.tasks.id, { onDelete: "cascade" }),
    userId: (0, mysql_core_1.varchar)("user_id", { length: 36 })
        .notNull()
        .references(() => exports.users.id, { onDelete: "cascade" }),
}, (table) => [(0, mysql_core_1.unique)("task_user_unique").on(table.taskId, table.userId)]);
// Activity Logs (Audit trail - highly recommended)
exports.activityLogs = (0, mysql_core_1.mysqlTable)("activity_logs", {
    id: (0, mysql_core_2.bigint)("id", { mode: "number" }).autoincrement().primaryKey(),
    userId: (0, mysql_core_1.varchar)("user_id", { length: 36 })
        .notNull()
        .references(() => exports.users.id),
    workspaceId: (0, mysql_core_1.varchar)("workspace_id", { length: 36 }).references(() => exports.workspaces.id),
    action: (0, mysql_core_1.varchar)("action", { length: 100 }).notNull(),
    entityType: (0, mysql_core_1.varchar)("entity_type", { length: 50 }),
    entityId: (0, mysql_core_1.varchar)("entity_id", { length: 36 }),
    details: (0, mysql_core_1.json)("details"),
    ipAddress: (0, mysql_core_1.varchar)("ip_address", { length: 45 }),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow().notNull(),
}, (table) => [
    (0, mysql_core_1.index)("activity_user_idx").on(table.userId),
    (0, mysql_core_1.index)("activity_workspace_idx").on(table.workspaceId),
    (0, mysql_core_1.index)("activity_created_idx").on(table.createdAt),
]);
// Attendance
exports.attendance = (0, mysql_core_1.mysqlTable)("attendance", {
    id: (0, mysql_core_1.varchar)("id", { length: 36 })
        .primaryKey()
        .default((0, drizzle_orm_1.sql) `(UUID())`),
    userId: (0, mysql_core_1.varchar)("user_id", { length: 36 })
        .notNull()
        .references(() => exports.users.id),
    workspaceId: (0, mysql_core_1.varchar)("workspace_id", { length: 36 })
        .notNull()
        .references(() => exports.workspaces.id, { onDelete: "cascade" }),
    date: (0, mysql_core_1.timestamp)("date").notNull(),
    status: (0, mysql_core_1.mysqlEnum)("status", [
        "PRESENT",
        "LATE",
        "ABSENT",
        "HALF_DAY",
        "ON_LEAVE",
    ]).notNull(),
    markedById: (0, mysql_core_1.varchar)("marked_by_id", { length: 36 }).references(() => exports.users.id),
    notes: (0, mysql_core_1.text)("notes"),
}, (table) => [
    (0, mysql_core_1.unique)("attendance_user_date_unique").on(table.userId, table.date),
]);
// Leaves
exports.leaves = (0, mysql_core_1.mysqlTable)("leaves", {
    id: (0, mysql_core_1.varchar)("id", { length: 36 })
        .primaryKey()
        .default((0, drizzle_orm_1.sql) `(UUID())`),
    userId: (0, mysql_core_1.varchar)("user_id", { length: 36 })
        .notNull()
        .references(() => exports.users.id),
    workspaceId: (0, mysql_core_1.varchar)("workspace_id", { length: 36 })
        .notNull()
        .references(() => exports.workspaces.id, { onDelete: "cascade" }),
    startDate: (0, mysql_core_1.timestamp)("start_date").notNull(),
    endDate: (0, mysql_core_1.timestamp)("end_date").notNull(),
    type: (0, mysql_core_1.mysqlEnum)("type", ["CASUAL", "SICK", "EARNED", "UNPAID"]).notNull(),
    status: (0, mysql_core_1.mysqlEnum)("status", ["PENDING", "APPROVED", "REJECTED"]).default("PENDING"),
    reason: (0, mysql_core_1.text)("reason"),
    approvedById: (0, mysql_core_1.varchar)("approved_by_id", { length: 36 }).references(() => exports.users.id),
});
// Email Templates
exports.emailTemplates = (0, mysql_core_1.mysqlTable)("email_templates", {
    id: (0, mysql_core_1.varchar)("id", { length: 36 })
        .primaryKey()
        .default((0, drizzle_orm_1.sql) `(UUID())`),
    name: (0, mysql_core_1.varchar)("name", { length: 100 }).notNull(),
    subject: (0, mysql_core_1.varchar)("subject", { length: 255 }).notNull(),
    body: (0, mysql_core_1.text)("body").notNull(),
    category: (0, mysql_core_1.varchar)("category", { length: 50 }).default("General"),
    isSystem: (0, mysql_core_1.boolean)("is_system").default(false),
    createdById: (0, mysql_core_1.varchar)("created_by_id", { length: 36 }).references(() => exports.users.id),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow().notNull(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow(),
});
// ------------------- Relations -------------------
exports.workspacesRelations = (0, drizzle_orm_1.relations)(exports.workspaces, ({ many }) => ({
    users: many(exports.users),
    teams: many(exports.teams),
    tasks: many(exports.tasks),
    activityLogs: many(exports.activityLogs),
}));
exports.usersRelations = (0, drizzle_orm_1.relations)(exports.users, ({ one, many }) => ({
    role: one(exports.roles, { fields: [exports.users.roleId], references: [exports.roles.id] }),
    workspace: one(exports.workspaces, {
        fields: [exports.users.workspaceId],
        references: [exports.workspaces.id],
    }),
    team: one(exports.teams, { fields: [exports.users.teamId], references: [exports.teams.id] }),
    customPermissions: many(exports.userPermissions),
    assignedTasks: many(exports.tasks, { relationName: "TaskAssignee" }),
    createdTasks: many(exports.tasks, { relationName: "TaskCreator" }),
    activityLogs: many(exports.activityLogs),
    attendance: many(exports.attendance),
    leaves: many(exports.leaves),
}));
// Add other relations as needed (roles, permissions, tasks, etc.)
exports.tasksRelations = (0, drizzle_orm_1.relations)(exports.tasks, ({ one }) => ({
    workspace: one(exports.workspaces, {
        fields: [exports.tasks.workspaceId],
        references: [exports.workspaces.id],
    }),
    team: one(exports.teams, { fields: [exports.tasks.teamId], references: [exports.teams.id] }),
    assignee: one(exports.users, {
        fields: [exports.tasks.assigneeId],
        references: [exports.users.id],
        relationName: "TaskAssignee",
    }),
    creator: one(exports.users, {
        fields: [exports.tasks.createdById],
        references: [exports.users.id],
        relationName: "TaskCreator",
    }),
}));
exports.emailLogs = (0, mysql_core_1.mysqlTable)("email_logs", {
    id: (0, mysql_core_1.varchar)("id", { length: 36 }).primaryKey().default((0, drizzle_orm_1.sql) `(UUID())`),
    workspaceId: (0, mysql_core_1.varchar)("workspace_id", { length: 36 })
        .notNull()
        .references(() => exports.workspaces.id, { onDelete: "cascade" }),
    senderId: (0, mysql_core_1.varchar)("sender_id", { length: 36 })
        .notNull()
        .references(() => exports.users.id, { onDelete: "cascade" }),
    recipientEmail: (0, mysql_core_1.varchar)("recipient_email", { length: 255 }).notNull(),
    subject: (0, mysql_core_1.varchar)("subject", { length: 255 }).notNull(),
    status: (0, mysql_core_1.varchar)("status", { length: 20 }).default("sent"),
    sentAt: (0, mysql_core_1.timestamp)("sent_at").defaultNow().notNull(),
}, (table) => [
    (0, mysql_core_1.index)("email_logs_workspace_idx").on(table.workspaceId),
    (0, mysql_core_1.index)("email_logs_sender_idx").on(table.senderId),
    (0, mysql_core_1.index)("email_logs_status_idx").on(table.status),
    (0, mysql_core_1.index)("email_logs_sent_at_idx").on(table.sentAt),
]);
// You can export everything
__exportStar(require("./schema"), exports);
