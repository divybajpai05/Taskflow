"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailLogsRelations = exports.emailTemplatesRelations = exports.userPermissionsRelations = exports.rolePermissionsRelations = exports.permissionsRelations = exports.activityLogsRelations = exports.leaveTypesRelations = exports.leavesRelations = exports.attendanceRelations = exports.taskAssigneesRelations = exports.tasksRelations = exports.teamsRelations = exports.rolesRelations = exports.workspaceMembersRelations = exports.usersRelations = exports.workspacesRelations = exports.emailLogs = exports.emailTemplates = exports.leaveTypes = exports.leaves = exports.attendance = exports.activityLogs = exports.taskAssignees = exports.tasks = exports.teams = exports.users = exports.userPermissions = exports.rolePermissions = exports.permissions = exports.roles = exports.workspaces = exports.workspaceMembers = void 0;
// src/db/schema.ts
const mysql_core_1 = require("drizzle-orm/mysql-core");
const drizzle_orm_1 = require("drizzle-orm");
const mysql_core_2 = require("drizzle-orm/mysql-core");
// ==================== TABLES ====================
// Workspace Members (Junction Table - Multi-workspace support)
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
    (0, mysql_core_1.index)("wm_user_idx").on(table.userId),
    (0, mysql_core_1.index)("wm_workspace_idx").on(table.workspaceId),
]);
// Workspaces
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
// Roles
exports.roles = (0, mysql_core_1.mysqlTable)("roles", {
    id: (0, mysql_core_1.varchar)("id", { length: 36 })
        .primaryKey()
        .default((0, drizzle_orm_1.sql) `(UUID())`),
    name: (0, mysql_core_1.varchar)("name", { length: 100 }).notNull().unique(),
    description: (0, mysql_core_1.text)("description"),
    isSystem: (0, mysql_core_1.boolean)("is_system").default(false),
});
// Permissions
exports.permissions = (0, mysql_core_1.mysqlTable)("permissions", {
    id: (0, mysql_core_1.varchar)("id", { length: 36 })
        .primaryKey()
        .default((0, drizzle_orm_1.sql) `(UUID())`),
    name: (0, mysql_core_1.varchar)("name", { length: 100 }).notNull().unique(),
    description: (0, mysql_core_1.text)("description"),
    module: (0, mysql_core_1.varchar)("module", { length: 50 }),
});
// Role <-> Permission
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
// Users
exports.users = (0, mysql_core_1.mysqlTable)("users", {
    id: (0, mysql_core_1.varchar)("id", { length: 36 })
        .primaryKey()
        .default((0, drizzle_orm_1.sql) `(UUID())`),
    email: (0, mysql_core_1.varchar)("email", { length: 255 }).notNull().unique(),
    name: (0, mysql_core_1.varchar)("name", { length: 150 }).notNull(),
    phone: (0, mysql_core_1.varchar)("phone", { length: 20 }),
    password: (0, mysql_core_1.text)("password").notNull(),
    emailVerified: (0, mysql_core_1.boolean)("email_verified").default(false),
    emailVerificationToken: (0, mysql_core_1.text)("email_verification_token"),
    emailVerificationExpires: (0, mysql_core_1.timestamp)("email_verification_expires"),
    passwordResetToken: (0, mysql_core_1.text)("password_reset_token"),
    passwordResetExpires: (0, mysql_core_1.timestamp)("password_reset_expires"),
    refreshToken: (0, mysql_core_1.text)("refresh_token"),
    lastLoginAt: (0, mysql_core_1.timestamp)("last_login_at"),
    lastLoginIp: (0, mysql_core_1.varchar)("last_login_ip", { length: 45 }),
    avatar: (0, mysql_core_1.varchar)("avatar", { length: 500 }),
    employmentType: (0, mysql_core_1.mysqlEnum)("employment_type", [
        "Full-time",
        "Contract",
        "Remote",
    ]).default("Full-time"),
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
// Tasks
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
// Task Assignees
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
// Activity Logs
exports.activityLogs = (0, mysql_core_1.mysqlTable)("activity_logs", {
    id: (0, mysql_core_2.bigint)("id", { mode: "number" }).autoincrement().primaryKey(),
    userId: (0, mysql_core_1.varchar)("user_id", { length: 36 })
        .notNull()
        .references(() => exports.users.id),
    workspaceId: (0, mysql_core_1.varchar)("workspace_id", { length: 36 }).references(() => exports.workspaces.id),
    action: (0, mysql_core_1.varchar)("action", { length: 500 }).notNull(),
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
    leaveTypeId: (0, mysql_core_1.varchar)("leave_type_id", { length: 36 })
        .notNull()
        .references(() => exports.leaveTypes.id, { onDelete: "restrict" }),
    startDate: (0, mysql_core_1.timestamp)("start_date").notNull(),
    endDate: (0, mysql_core_1.timestamp)("end_date").notNull(),
    status: (0, mysql_core_1.mysqlEnum)("status", ["PENDING", "APPROVED", "REJECTED"]).default("PENDING"),
    reason: (0, mysql_core_1.text)("reason"),
    approvedById: (0, mysql_core_1.varchar)("approved_by_id", { length: 36 }).references(() => exports.users.id),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow().notNull(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow().notNull(),
});
// Leave Types
exports.leaveTypes = (0, mysql_core_1.mysqlTable)("leave_types", {
    id: (0, mysql_core_1.varchar)("id", { length: 36 })
        .primaryKey()
        .default((0, drizzle_orm_1.sql) `(UUID())`),
    workspaceId: (0, mysql_core_1.varchar)("workspace_id", { length: 36 })
        .notNull()
        .references(() => exports.workspaces.id, { onDelete: "cascade" }),
    name: (0, mysql_core_1.varchar)("name", { length: 100 }).notNull(),
    description: (0, mysql_core_1.text)("description"),
    color: (0, mysql_core_1.varchar)("color", { length: 7 }).notNull().default("#3b82f6"),
    isPaid: (0, mysql_core_1.boolean)("is_paid").notNull().default(true),
    defaultDays: (0, mysql_core_1.int)("default_days").notNull().default(0),
    requiresApproval: (0, mysql_core_1.boolean)("requires_approval").notNull().default(true),
    isActive: (0, mysql_core_1.boolean)("is_active").notNull().default(true),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow().notNull(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow().notNull(),
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
// Email Logs
exports.emailLogs = (0, mysql_core_1.mysqlTable)("email_logs", {
    id: (0, mysql_core_1.varchar)("id", { length: 36 })
        .primaryKey()
        .default((0, drizzle_orm_1.sql) `(UUID())`),
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
// ==================== RELATIONS ====================
exports.workspacesRelations = (0, drizzle_orm_1.relations)(exports.workspaces, ({ many }) => ({
    members: many(exports.workspaceMembers),
    teams: many(exports.teams),
    tasks: many(exports.tasks),
    activityLogs: many(exports.activityLogs),
    leaveTypes: many(exports.leaveTypes),
}));
exports.usersRelations = (0, drizzle_orm_1.relations)(exports.users, ({ many }) => ({
    workspaceMemberships: many(exports.workspaceMembers),
    customPermissions: many(exports.userPermissions),
    assignedTasks: many(exports.taskAssignees),
    createdTasks: many(exports.tasks, { relationName: "TaskCreator" }),
    activityLogs: many(exports.activityLogs),
    attendance: many(exports.attendance),
    leaves: many(exports.leaves),
    sentEmails: many(exports.emailLogs, { relationName: "EmailSender" }),
}));
exports.workspaceMembersRelations = (0, drizzle_orm_1.relations)(exports.workspaceMembers, ({ one }) => ({
    user: one(exports.users, {
        fields: [exports.workspaceMembers.userId],
        references: [exports.users.id],
    }),
    workspace: one(exports.workspaces, {
        fields: [exports.workspaceMembers.workspaceId],
        references: [exports.workspaces.id],
    }),
    role: one(exports.roles, {
        fields: [exports.workspaceMembers.roleId],
        references: [exports.roles.id],
    }),
    team: one(exports.teams, {
        fields: [exports.workspaceMembers.teamId],
        references: [exports.teams.id],
    }),
}));
exports.rolesRelations = (0, drizzle_orm_1.relations)(exports.roles, ({ many }) => ({
    workspaceMembers: many(exports.workspaceMembers),
    rolePermissions: many(exports.rolePermissions),
}));
exports.teamsRelations = (0, drizzle_orm_1.relations)(exports.teams, ({ one, many }) => ({
    workspace: one(exports.workspaces, {
        fields: [exports.teams.workspaceId],
        references: [exports.workspaces.id],
    }),
    members: many(exports.workspaceMembers),
    tasks: many(exports.tasks),
}));
exports.tasksRelations = (0, drizzle_orm_1.relations)(exports.tasks, ({ one, many }) => ({
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
    assignees: many(exports.taskAssignees),
}));
exports.taskAssigneesRelations = (0, drizzle_orm_1.relations)(exports.taskAssignees, ({ one }) => ({
    task: one(exports.tasks, { fields: [exports.taskAssignees.taskId], references: [exports.tasks.id] }),
    user: one(exports.users, { fields: [exports.taskAssignees.userId], references: [exports.users.id] }),
}));
exports.attendanceRelations = (0, drizzle_orm_1.relations)(exports.attendance, ({ one }) => ({
    user: one(exports.users, { fields: [exports.attendance.userId], references: [exports.users.id] }),
    workspace: one(exports.workspaces, {
        fields: [exports.attendance.workspaceId],
        references: [exports.workspaces.id],
    }),
    markedBy: one(exports.users, {
        fields: [exports.attendance.markedById],
        references: [exports.users.id],
        relationName: "AttendanceMarker",
    }),
}));
exports.leavesRelations = (0, drizzle_orm_1.relations)(exports.leaves, ({ one }) => ({
    user: one(exports.users, { fields: [exports.leaves.userId], references: [exports.users.id] }),
    workspace: one(exports.workspaces, {
        fields: [exports.leaves.workspaceId],
        references: [exports.workspaces.id],
    }),
    leaveType: one(exports.leaveTypes, {
        fields: [exports.leaves.leaveTypeId],
        references: [exports.leaveTypes.id],
    }),
    approvedBy: one(exports.users, {
        fields: [exports.leaves.approvedById],
        references: [exports.users.id],
        relationName: "LeaveApprover",
    }),
}));
exports.leaveTypesRelations = (0, drizzle_orm_1.relations)(exports.leaveTypes, ({ one, many }) => ({
    workspace: one(exports.workspaces, {
        fields: [exports.leaveTypes.workspaceId],
        references: [exports.workspaces.id],
    }),
    leaves: many(exports.leaves),
}));
exports.activityLogsRelations = (0, drizzle_orm_1.relations)(exports.activityLogs, ({ one }) => ({
    user: one(exports.users, { fields: [exports.activityLogs.userId], references: [exports.users.id] }),
    workspace: one(exports.workspaces, {
        fields: [exports.activityLogs.workspaceId],
        references: [exports.workspaces.id],
    }),
}));
exports.permissionsRelations = (0, drizzle_orm_1.relations)(exports.permissions, ({ many }) => ({
    rolePermissions: many(exports.rolePermissions),
    userPermissions: many(exports.userPermissions),
}));
exports.rolePermissionsRelations = (0, drizzle_orm_1.relations)(exports.rolePermissions, ({ one }) => ({
    role: one(exports.roles, {
        fields: [exports.rolePermissions.roleId],
        references: [exports.roles.id],
    }),
    permission: one(exports.permissions, {
        fields: [exports.rolePermissions.permissionId],
        references: [exports.permissions.id],
    }),
}));
exports.userPermissionsRelations = (0, drizzle_orm_1.relations)(exports.userPermissions, ({ one }) => ({
    user: one(exports.users, {
        fields: [exports.userPermissions.userId],
        references: [exports.users.id],
    }),
    permission: one(exports.permissions, {
        fields: [exports.userPermissions.permissionId],
        references: [exports.permissions.id],
    }),
}));
exports.emailTemplatesRelations = (0, drizzle_orm_1.relations)(exports.emailTemplates, ({ one }) => ({
    createdBy: one(exports.users, {
        fields: [exports.emailTemplates.createdById],
        references: [exports.users.id],
    }),
}));
exports.emailLogsRelations = (0, drizzle_orm_1.relations)(exports.emailLogs, ({ one }) => ({
    workspace: one(exports.workspaces, {
        fields: [exports.emailLogs.workspaceId],
        references: [exports.workspaces.id],
    }),
    sender: one(exports.users, {
        fields: [exports.emailLogs.senderId],
        references: [exports.users.id],
        relationName: "EmailSender",
    }),
}));
