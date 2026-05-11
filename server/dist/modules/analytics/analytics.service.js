"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
// src/modules/analytics/analytics.service.ts
const drizzle_1 = require("../../db/drizzle");
const schema_1 = require("../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
class AnalyticsService {
    /**
     * Get KPI metrics for Analytics Dashboard
     */
    async getKPIData(workspaceId, dateFrom, dateTo, memberId, teamId, status, priority) {
        const now = new Date();
        const startDate = dateFrom
            ? new Date(dateFrom)
            : new Date(now.getFullYear(), now.getMonth(), 1);
        const endDate = dateTo ? new Date(dateTo + "T23:59:59") : now;
        // Calculate previous period (same length as current period)
        const periodLength = endDate.getTime() - startDate.getTime();
        const prevEndDate = new Date(startDate.getTime() - 1);
        const prevStartDate = new Date(prevEndDate.getTime() - periodLength);
        // Build filters
        const filters = await this.buildFilters(workspaceId, memberId, teamId, status, priority);
        const currentPeriodFilters = [
            ...filters,
            (0, drizzle_orm_1.gte)(schema_1.tasks.createdAt, startDate),
            (0, drizzle_orm_1.lte)(schema_1.tasks.createdAt, endDate),
        ];
        const prevPeriodFilters = [
            ...filters,
            (0, drizzle_orm_1.gte)(schema_1.tasks.createdAt, prevStartDate),
            (0, drizzle_orm_1.lte)(schema_1.tasks.createdAt, prevEndDate),
        ];
        // ===== CURRENT PERIOD METRICS =====
        // Total Tasks
        const [totalTasksResult] = await drizzle_1.db
            .select({ count: (0, drizzle_orm_1.count)() })
            .from(schema_1.tasks)
            .where((0, drizzle_orm_1.and)(...currentPeriodFilters));
        const totalTasks = totalTasksResult?.count || 0;
        // Completed Tasks
        const [completedResult] = await drizzle_1.db
            .select({ count: (0, drizzle_orm_1.count)() })
            .from(schema_1.tasks)
            .where((0, drizzle_orm_1.and)(...currentPeriodFilters, (0, drizzle_orm_1.eq)(schema_1.tasks.status, "DONE")));
        const completedTasks = completedResult?.count || 0;
        // Overdue Tasks
        const [overdueResult] = await drizzle_1.db
            .select({ count: (0, drizzle_orm_1.count)() })
            .from(schema_1.tasks)
            .where((0, drizzle_orm_1.and)(...currentPeriodFilters, (0, drizzle_orm_1.sql) `${schema_1.tasks.status} NOT IN ('DONE', 'CANCELLED')`, (0, drizzle_orm_1.sql) `${schema_1.tasks.dueDate} IS NOT NULL`, (0, drizzle_orm_1.sql) `${schema_1.tasks.dueDate} < NOW()`));
        const overdueTasks = overdueResult?.count || 0;
        // In Progress Tasks
        const [inProgressResult] = await drizzle_1.db
            .select({ count: (0, drizzle_orm_1.count)() })
            .from(schema_1.tasks)
            .where((0, drizzle_orm_1.and)(...currentPeriodFilters, (0, drizzle_orm_1.eq)(schema_1.tasks.status, "IN_PROGRESS")));
        const inProgressTasks = inProgressResult?.count || 0;
        // ===== ON-TIME COMPLETION RATE =====
        let onTimeRate = 0;
        if (totalTasks > 0) {
            const [onTimeCompletedResult] = await drizzle_1.db
                .select({ count: (0, drizzle_orm_1.count)() })
                .from(schema_1.tasks)
                .where((0, drizzle_orm_1.and)(...currentPeriodFilters, (0, drizzle_orm_1.eq)(schema_1.tasks.status, "DONE"), (0, drizzle_orm_1.sql) `(
              ${schema_1.tasks.dueDate} IS NULL 
              OR ${schema_1.tasks.dueDate} >= ${schema_1.tasks.updatedAt}
            )`));
            const onTimeCompleted = onTimeCompletedResult?.count || 0;
            onTimeRate = Math.round((onTimeCompleted / totalTasks) * 100);
        }
        // ===== AVERAGE COMPLETION TIME =====
        let avgCompletionDays = 0;
        if (completedTasks > 0) {
            const completedTasksData = await drizzle_1.db
                .select({
                createdAt: schema_1.tasks.createdAt,
                updatedAt: schema_1.tasks.updatedAt,
            })
                .from(schema_1.tasks)
                .where((0, drizzle_orm_1.and)(...currentPeriodFilters, (0, drizzle_orm_1.eq)(schema_1.tasks.status, "DONE")));
            if (completedTasksData.length > 0) {
                const totalDays = completedTasksData.reduce((sum, task) => {
                    const created = new Date(task.createdAt || new Date());
                    const updated = new Date(task.updatedAt || new Date());
                    const diffDays = (updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
                    return sum + Math.max(0, diffDays);
                }, 0);
                avgCompletionDays =
                    Math.round((totalDays / completedTasksData.length) * 10) / 10;
            }
        }
        // ===== PREVIOUS PERIOD METRICS =====
        const [prevTotalResult] = await drizzle_1.db
            .select({ count: (0, drizzle_orm_1.count)() })
            .from(schema_1.tasks)
            .where((0, drizzle_orm_1.and)(...prevPeriodFilters));
        const prevTotalTasks = prevTotalResult?.count || 0;
        const [prevCompletedResult] = await drizzle_1.db
            .select({ count: (0, drizzle_orm_1.count)() })
            .from(schema_1.tasks)
            .where((0, drizzle_orm_1.and)(...prevPeriodFilters, (0, drizzle_orm_1.eq)(schema_1.tasks.status, "DONE")));
        const prevCompletedTasks = prevCompletedResult?.count || 0;
        const [prevOverdueResult] = await drizzle_1.db
            .select({ count: (0, drizzle_orm_1.count)() })
            .from(schema_1.tasks)
            .where((0, drizzle_orm_1.and)(...prevPeriodFilters, (0, drizzle_orm_1.sql) `${schema_1.tasks.status} NOT IN ('DONE', 'CANCELLED')`, (0, drizzle_orm_1.sql) `${schema_1.tasks.dueDate} IS NOT NULL`, (0, drizzle_orm_1.sql) `${schema_1.tasks.dueDate} < ${prevEndDate}`));
        const prevOverdueTasks = prevOverdueResult?.count || 0;
        let prevOnTimeRate = 0;
        if (prevTotalTasks > 0) {
            const [prevOnTimeResult] = await drizzle_1.db
                .select({ count: (0, drizzle_orm_1.count)() })
                .from(schema_1.tasks)
                .where((0, drizzle_orm_1.and)(...prevPeriodFilters, (0, drizzle_orm_1.eq)(schema_1.tasks.status, "DONE"), (0, drizzle_orm_1.sql) `(
              ${schema_1.tasks.dueDate} IS NULL 
              OR ${schema_1.tasks.dueDate} >= ${schema_1.tasks.updatedAt}
            )`));
            const prevOnTimeCompleted = prevOnTimeResult?.count || 0;
            prevOnTimeRate = Math.round((prevOnTimeCompleted / prevTotalTasks) * 100);
        }
        let prevAvgCompletionDays = 0;
        if (prevCompletedTasks > 0) {
            const prevCompletedTasksData = await drizzle_1.db
                .select({
                createdAt: schema_1.tasks.createdAt,
                updatedAt: schema_1.tasks.updatedAt,
            })
                .from(schema_1.tasks)
                .where((0, drizzle_orm_1.and)(...prevPeriodFilters, (0, drizzle_orm_1.eq)(schema_1.tasks.status, "DONE")));
            if (prevCompletedTasksData.length > 0) {
                const totalDays = prevCompletedTasksData.reduce((sum, task) => {
                    const created = new Date(task.createdAt || new Date());
                    const updated = new Date(task.updatedAt || new Date());
                    const diffDays = (updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
                    return sum + Math.max(0, diffDays);
                }, 0);
                prevAvgCompletionDays =
                    Math.round((totalDays / prevCompletedTasksData.length) * 10) / 10;
            }
        }
        // ===== CALCULATE PERCENTAGE CHANGES =====
        let tasksCreatedChange = 0;
        if (prevTotalTasks > 0) {
            tasksCreatedChange = Math.round(((totalTasks - prevTotalTasks) / prevTotalTasks) * 100);
        }
        else if (totalTasks > 0) {
            tasksCreatedChange = 100;
        }
        let tasksCompletedChange = 0;
        if (prevCompletedTasks > 0) {
            tasksCompletedChange = Math.round(((completedTasks - prevCompletedTasks) / prevCompletedTasks) * 100);
        }
        else if (completedTasks > 0) {
            tasksCompletedChange = 100;
        }
        let overdueChange = 0;
        if (prevOverdueTasks > 0) {
            overdueChange = Math.round(((overdueTasks - prevOverdueTasks) / prevOverdueTasks) * 100);
        }
        else if (overdueTasks > 0) {
            overdueChange = 100;
        }
        // ===== VALIDATION =====
        if (totalTasks === 0) {
            return {
                totalTasks: 0,
                completed: 0,
                overdue: 0,
                inProgress: 0,
                onTimeCompletion: 0,
                avgCompletionTime: 0,
                previousTotalTasks: prevTotalTasks,
                previousCompleted: prevCompletedTasks,
                previousOverdue: prevOverdueTasks,
                previousOnTime: prevOnTimeRate,
                previousAvgTime: prevAvgCompletionDays,
                tasksCreatedChange,
                tasksCompletedChange,
                overdueChange,
            };
        }
        const validatedCompleted = Math.min(completedTasks, totalTasks);
        const maxOverdue = totalTasks - validatedCompleted;
        const validatedOverdue = Math.min(overdueTasks, maxOverdue);
        const validatedInProgress = Math.min(inProgressTasks, maxOverdue);
        return {
            totalTasks,
            completed: validatedCompleted,
            overdue: validatedOverdue,
            inProgress: validatedInProgress,
            onTimeCompletion: onTimeRate,
            avgCompletionTime: avgCompletionDays,
            previousTotalTasks: prevTotalTasks,
            previousCompleted: prevCompletedTasks,
            previousOverdue: prevOverdueTasks,
            previousOnTime: prevOnTimeRate,
            previousAvgTime: prevAvgCompletionDays,
            tasksCreatedChange,
            tasksCompletedChange,
            overdueChange,
        };
    }
    /**
     * Get chart data for Analytics
     */
    async getChartData(workspaceId, dateFrom, dateTo, memberId, teamId, status, priority) {
        const now = new Date();
        // FIXED: Use local timezone for dates (not UTC ISO strings)
        const endDate = dateTo ? new Date(dateTo) : new Date();
        endDate.setHours(23, 59, 59, 999); // Local end of day
        const startDate = dateFrom
            ? new Date(dateFrom)
            : new Date(now.getFullYear(), now.getMonth(), 1);
        startDate.setHours(0, 0, 0, 0); // Local start of day
        console.log("📊 getChartData - Date Range:", {
            startDate: startDate.toString(),
            endDate: endDate.toString(),
            startDateISO: startDate.toISOString(),
            endDateISO: endDate.toISOString(),
            memberId,
            teamId,
            status,
            priority,
        });
        const filters = await this.buildFilters(workspaceId, memberId, teamId, status, priority);
        const allFilters = [
            ...filters,
            (0, drizzle_orm_1.gte)(schema_1.tasks.createdAt, startDate),
            (0, drizzle_orm_1.lte)(schema_1.tasks.createdAt, endDate),
        ];
        // Task Completion Trend - dynamic range based on date selection
        const daysDiff = Math.min(30, Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)));
        const trendData = [];
        for (let i = daysDiff; i >= 0; i--) {
            const date = new Date(endDate);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split("T")[0]; // "2026-05-07"
            const [createdCount] = await drizzle_1.db
                .select({ count: (0, drizzle_orm_1.count)() })
                .from(schema_1.tasks)
                .where((0, drizzle_orm_1.and)(...filters, (0, drizzle_orm_1.sql) `DATE(${schema_1.tasks.createdAt}) = ${dateStr}`));
            const [completedCount] = await drizzle_1.db
                .select({ count: (0, drizzle_orm_1.count)() })
                .from(schema_1.tasks)
                .where((0, drizzle_orm_1.and)(...filters, (0, drizzle_orm_1.eq)(schema_1.tasks.status, "DONE"), (0, drizzle_orm_1.sql) `DATE(${schema_1.tasks.updatedAt}) = ${dateStr}`));
            console.log(`📅 ${dateStr} | created: ${createdCount?.count || 0} | completed: ${completedCount?.count || 0}`);
            trendData.push({
                name: date.toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                }),
                created: createdCount?.count || 0,
                completed: completedCount?.count || 0,
            });
        }
        // Status Distribution - with date filters
        const statusDistribution = await drizzle_1.db
            .select({ status: schema_1.tasks.status, count: (0, drizzle_orm_1.count)() })
            .from(schema_1.tasks)
            .where((0, drizzle_orm_1.and)(...allFilters))
            .groupBy(schema_1.tasks.status);
        console.log("📊 Status Distribution:", statusDistribution);
        const statusMap = {
            TODO: "Todo",
            IN_PROGRESS: "In progress",
            DONE: "Done",
            REVIEW: "On Hold",
            CANCELLED: "Cancelled",
            ON_HOLD: "On Hold",
        };
        // Priority Breakdown - with date filters
        const priorityBreakdown = await drizzle_1.db
            .select({ priority: schema_1.tasks.priority, count: (0, drizzle_orm_1.count)() })
            .from(schema_1.tasks)
            .where((0, drizzle_orm_1.and)(...allFilters))
            .groupBy(schema_1.tasks.priority);
        console.log("📊 Priority Breakdown Raw:", priorityBreakdown);
        const priorityMap = {
            LOW: "Low",
            MEDIUM: "Medium",
            HIGH: "High",
            URGENT: "Urgent",
        };
        // Fill missing priorities with 0
        const allPriorities = ["Low", "Medium", "High", "Urgent"];
        const priorityData = allPriorities.map((p) => {
            const found = priorityBreakdown.find((pb) => priorityMap[pb.priority || ""] === p);
            return { name: p, tasks: found?.count || 0 };
        });
        console.log("📊 Priority Breakdown Final:", priorityData);
        const result = {
            trendData,
            statusDistribution: statusDistribution.map((s) => ({
                name: statusMap[s.status || ""] || s.status,
                value: s.count,
            })),
            priorityBreakdown: priorityData,
        };
        console.log("📊 getChartData Result:", {
            trendDays: result.trendData.length,
            statusCount: result.statusDistribution.length,
            priorityCount: result.priorityBreakdown.length,
        });
        return result;
    }
    /**
     * Get team performance data
     */
    async getTeamPerformance(workspaceId, dateFrom, dateTo, memberId, teamId) {
        const now = new Date();
        const startDate = dateFrom
            ? new Date(dateFrom)
            : new Date(now.getFullYear(), now.getMonth(), 1);
        const endDate = dateTo ? new Date(dateTo + "T23:59:59") : now;
        const memberFilters = [
            (0, drizzle_orm_1.eq)(schema_1.workspaceMembers.workspaceId, workspaceId),
            (0, drizzle_orm_1.eq)(schema_1.users.isActive, true),
        ];
        if (teamId && teamId !== "all")
            memberFilters.push((0, drizzle_orm_1.eq)(schema_1.workspaceMembers.teamId, teamId));
        if (memberId && memberId !== "all")
            memberFilters.push((0, drizzle_orm_1.eq)(schema_1.users.id, memberId));
        const members = await drizzle_1.db
            .select({ id: schema_1.users.id, name: schema_1.users.name, team: schema_1.teams.name })
            .from(schema_1.users)
            .innerJoin(schema_1.workspaceMembers, (0, drizzle_orm_1.eq)(schema_1.users.id, schema_1.workspaceMembers.userId))
            .leftJoin(schema_1.teams, (0, drizzle_orm_1.eq)(schema_1.workspaceMembers.teamId, schema_1.teams.id))
            .where((0, drizzle_orm_1.and)(...memberFilters));
        const performance = await Promise.all(members.map(async (member) => {
            const taskFilters = [
                (0, drizzle_orm_1.eq)(schema_1.tasks.workspaceId, workspaceId),
                (0, drizzle_orm_1.gte)(schema_1.tasks.createdAt, startDate),
                (0, drizzle_orm_1.lte)(schema_1.tasks.createdAt, endDate),
            ];
            const assignedTasks = await drizzle_1.db
                .select({
                id: schema_1.tasks.id,
                status: schema_1.tasks.status,
                dueDate: schema_1.tasks.dueDate,
                createdAt: schema_1.tasks.createdAt,
                updatedAt: schema_1.tasks.updatedAt,
            })
                .from(schema_1.tasks)
                .innerJoin(schema_1.taskAssignees, (0, drizzle_orm_1.eq)(schema_1.tasks.id, schema_1.taskAssignees.taskId))
                .where((0, drizzle_orm_1.and)(...taskFilters, (0, drizzle_orm_1.eq)(schema_1.taskAssignees.userId, member.id)));
            const totalAssigned = assignedTasks.length;
            const completed = assignedTasks.filter((t) => t.status === "DONE").length;
            const completionRate = totalAssigned > 0 ? Math.round((completed / totalAssigned) * 100) : 0;
            const onTimeTasks = assignedTasks.filter((t) => {
                if (t.status !== "DONE" || !t.dueDate)
                    return false;
                return new Date(t.updatedAt || "") <= new Date(t.dueDate);
            });
            const onTimeRate = completed > 0
                ? Math.round((onTimeTasks.length / completed) * 100)
                : 0;
            const overdueCount = assignedTasks.filter((t) => {
                if (!t.dueDate || t.status === "DONE" || t.status === "CANCELLED")
                    return false;
                return new Date(t.dueDate) < new Date();
            }).length;
            const completedTasks = assignedTasks.filter((t) => t.status === "DONE");
            let avgTime = 0;
            if (completedTasks.length > 0) {
                const totalDays = completedTasks.reduce((sum, t) => {
                    return (sum +
                        (new Date(t.updatedAt || "").getTime() -
                            new Date(t.createdAt || "").getTime()) /
                            (1000 * 60 * 60 * 24));
                }, 0);
                avgTime = Math.round((totalDays / completedTasks.length) * 10) / 10;
            }
            const activeTasks = assignedTasks.filter((t) => t.status !== "DONE" && t.status !== "CANCELLED").length;
            const workload = totalAssigned > 0
                ? Math.round((activeTasks / Math.max(totalAssigned, 10)) * 100)
                : 0;
            return {
                id: member.id,
                name: member.name || "Unknown",
                initials: member.name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2) || "?",
                team: member.team || "N/A",
                tasksAssigned: totalAssigned,
                tasksCompleted: completed,
                completionRate,
                onTimeRate,
                overdueCount,
                avgCompletionTime: avgTime,
                workload,
            };
        }));
        performance.sort((a, b) => b.completionRate - a.completionRate);
        return performance;
    }
    /**
     * Get task details list
     */
    async getTaskDetails(workspaceId, dateFrom, dateTo, memberId, teamId, status, priority) {
        const now = new Date();
        const startDate = dateFrom
            ? new Date(dateFrom)
            : new Date(now.getFullYear(), now.getMonth(), 1);
        const endDate = dateTo ? new Date(dateTo + "T23:59:59") : now;
        const filters = await this.buildFilters(workspaceId, memberId, teamId, status, priority);
        const dateFilters = [
            (0, drizzle_orm_1.gte)(schema_1.tasks.createdAt, startDate),
            (0, drizzle_orm_1.lte)(schema_1.tasks.createdAt, endDate),
        ];
        const taskList = await drizzle_1.db
            .select({
            id: schema_1.tasks.id,
            title: schema_1.tasks.title,
            status: schema_1.tasks.status,
            priority: schema_1.tasks.priority,
            dueDate: schema_1.tasks.dueDate,
            createdAt: schema_1.tasks.createdAt,
            updatedAt: schema_1.tasks.updatedAt,
            teamName: schema_1.teams.name,
            assigneeNames: (0, drizzle_orm_1.sql) `GROUP_CONCAT(DISTINCT ${schema_1.users.name} SEPARATOR '|||')`.as("assigneeNames"),
        })
            .from(schema_1.tasks)
            .leftJoin(schema_1.taskAssignees, (0, drizzle_orm_1.eq)(schema_1.tasks.id, schema_1.taskAssignees.taskId))
            .leftJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.taskAssignees.userId, schema_1.users.id))
            .leftJoin(schema_1.teams, (0, drizzle_orm_1.eq)(schema_1.tasks.teamId, schema_1.teams.id))
            .where((0, drizzle_orm_1.and)(...filters, ...dateFilters))
            .groupBy(schema_1.tasks.id)
            .orderBy((0, drizzle_orm_1.desc)(schema_1.tasks.createdAt))
            .limit(100);
        const statusMap = {
            TODO: "Todo",
            IN_PROGRESS: "In progress",
            DONE: "Done",
            REVIEW: "On Hold",
            CANCELLED: "Cancelled",
            ON_HOLD: "On Hold",
        };
        const priorityMap = {
            LOW: "Low",
            MEDIUM: "Medium",
            HIGH: "High",
            URGENT: "Urgent",
        };
        return taskList.map((task) => {
            const isCompleted = task.status === "DONE";
            const isOverdue = !isCompleted && task.dueDate && new Date(task.dueDate) < new Date();
            const daysOverdue = isOverdue
                ? Math.ceil((new Date().getTime() - new Date(task.dueDate).getTime()) /
                    (1000 * 60 * 60 * 24))
                : 0;
            const timeTaken = isCompleted
                ? Math.ceil((new Date(task.updatedAt || "").getTime() -
                    new Date(task.createdAt || "").getTime()) /
                    (1000 * 60 * 60 * 24))
                : Math.ceil((new Date().getTime() - new Date(task.createdAt || "").getTime()) /
                    (1000 * 60 * 60 * 24));
            const assigneeNamesArray = task.assigneeNames
                ? task.assigneeNames.split("|||").filter(Boolean)
                : [];
            const assigneeInitialsArray = assigneeNamesArray.map((name) => name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2));
            return {
                id: task.id,
                title: task.title,
                assignee: assigneeNamesArray[0] || "Unassigned",
                assignees: assigneeNamesArray,
                team: task.teamName || "N/A",
                assigneeInitials: assigneeInitialsArray[0] || "?",
                assigneeInitialsList: assigneeInitialsArray,
                status: statusMap[task.status || ""] || task.status,
                priority: priorityMap[task.priority || ""] || task.priority,
                dueDate: task.dueDate
                    ? new Date(task.dueDate).toLocaleDateString("en-GB")
                    : "—",
                completedDate: isCompleted
                    ? new Date(task.updatedAt || "").toLocaleDateString("en-GB")
                    : undefined,
                daysOverdue: isOverdue ? daysOverdue : 0,
                timeTaken,
            };
        });
    }
    //  Get leave trends by team - using dynamic leave types
    async getLeaveTrends(workspaceId, dateFrom, dateTo) {
        const now = new Date();
        const endDate = dateTo ? new Date(dateTo) : now;
        const startDate = dateFrom
            ? new Date(dateFrom)
            : new Date(now.getFullYear(), now.getMonth(), 1);
        // Get active leave types
        const activeLeaveTypes = await drizzle_1.db
            .select()
            .from(schema_1.leaveTypes)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.leaveTypes.workspaceId, workspaceId), (0, drizzle_orm_1.eq)(schema_1.leaveTypes.isActive, true)));
        const leaveTypeKeyMap = {};
        const defaultColors = [
            "#3b82f6",
            "#ef4444",
            "#22c55e",
            "#f59e0b",
            "#8b5cf6",
            "#ec4899",
        ];
        activeLeaveTypes.forEach((lt, index) => {
            const key = lt.name.toLowerCase().replace(/\s+/g, "_");
            leaveTypeKeyMap[lt.id] = {
                key,
                color: lt.color || defaultColors[index % defaultColors.length],
                label: lt.name,
            };
        });
        // ===== TEAM WISE =====
        const leaveRecords = await drizzle_1.db
            .select({
            teamName: schema_1.teams.name,
            leaveTypeId: schema_1.leaves.leaveTypeId,
            leaveTypeName: schema_1.leaveTypes.name,
            count: (0, drizzle_orm_1.count)(),
        })
            .from(schema_1.leaves)
            .innerJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.leaves.userId, schema_1.users.id))
            .innerJoin(schema_1.workspaceMembers, (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.users.id, schema_1.workspaceMembers.userId), (0, drizzle_orm_1.eq)(schema_1.workspaceMembers.workspaceId, workspaceId)))
            .leftJoin(schema_1.teams, (0, drizzle_orm_1.eq)(schema_1.workspaceMembers.teamId, schema_1.teams.id))
            .leftJoin(schema_1.leaveTypes, (0, drizzle_orm_1.eq)(schema_1.leaves.leaveTypeId, schema_1.leaveTypes.id))
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.leaves.workspaceId, workspaceId), (0, drizzle_orm_1.eq)(schema_1.leaves.status, "APPROVED")))
            .groupBy(schema_1.teams.name, schema_1.leaves.leaveTypeId, schema_1.leaveTypes.name);
        const teamMap = new Map();
        leaveRecords.forEach((r) => {
            const teamName = r.teamName || "No Team";
            const ltInfo = leaveTypeKeyMap[r.leaveTypeId] || {
                key: (r.leaveTypeName || "other").toLowerCase().replace(/\s+/g, "_"),
                color: "#94a3b8",
                label: r.leaveTypeName || "Other",
            };
            if (!teamMap.has(teamName))
                teamMap.set(teamName, { team: teamName, total: 0 });
            const entry = teamMap.get(teamName);
            if (!entry.hasOwnProperty(ltInfo.key))
                entry[ltInfo.key] = 0;
            entry[ltInfo.key] += r.count;
            entry.total += r.count;
        });
        const teamData = Array.from(teamMap.values()).sort((a, b) => b.total - a.total);
        // ===== MONTHLY WISE (last 6 months) =====
        const monthlyData = [];
        for (let i = 5; i >= 0; i--) {
            const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1, 0, 0, 0, 0);
            const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
            const monthLeaves = await drizzle_1.db
                .select({
                leaveTypeId: schema_1.leaves.leaveTypeId,
                leaveTypeName: schema_1.leaveTypes.name,
                userId: schema_1.leaves.userId,
            })
                .from(schema_1.leaves)
                .leftJoin(schema_1.leaveTypes, (0, drizzle_orm_1.eq)(schema_1.leaves.leaveTypeId, schema_1.leaveTypes.id))
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.leaves.workspaceId, workspaceId), (0, drizzle_orm_1.eq)(schema_1.leaves.status, "APPROVED"), (0, drizzle_orm_1.lte)(schema_1.leaves.startDate, monthEnd), (0, drizzle_orm_1.gte)(schema_1.leaves.endDate, monthStart)));
            const typeUserMap = new Map();
            monthLeaves.forEach((leave) => {
                const ltInfo = leaveTypeKeyMap[leave.leaveTypeId] || {
                    key: (leave.leaveTypeName || "other")
                        .toLowerCase()
                        .replace(/\s+/g, "_"),
                    label: leave.leaveTypeName || "Other",
                };
                if (!typeUserMap.has(ltInfo.key))
                    typeUserMap.set(ltInfo.key, new Set());
                typeUserMap.get(ltInfo.key).add(leave.userId);
            });
            const monthEntry = {
                month: monthStart.toLocaleDateString("en-GB", {
                    month: "short",
                    year: "2-digit",
                }),
            };
            let totalForMonth = 0;
            activeLeaveTypes.forEach((lt) => {
                const key = leaveTypeKeyMap[lt.id]?.key ||
                    lt.name.toLowerCase().replace(/\s+/g, "_");
                const count = (typeUserMap.get(key) || new Set()).size;
                monthEntry[key] = count;
                totalForMonth += count;
            });
            monthEntry.total = totalForMonth;
            monthlyData.push(monthEntry);
        }
        // Build labels and colors
        const leaveTypeLabels = {};
        const leaveTypeColors = {};
        const leaveTypeKeysList = [];
        Object.values(leaveTypeKeyMap).forEach((v) => {
            leaveTypeLabels[v.key] = v.label;
            leaveTypeColors[v.key] = v.color;
            leaveTypeKeysList.push(v.key);
        });
        return {
            data: teamData,
            monthlyData,
            leaveTypeKeys: leaveTypeKeysList,
            leaveTypeLabels,
            leaveTypeColors,
        };
    }
    /**
     * Get team workload graph data
     */
    async getTeamWorkload(workspaceId, dateFrom, dateTo) {
        // ... (unchanged)
        const teamList = await drizzle_1.db
            .select({ id: schema_1.teams.id, name: schema_1.teams.name })
            .from(schema_1.teams)
            .where((0, drizzle_orm_1.eq)(schema_1.teams.workspaceId, workspaceId));
        const workload = await Promise.all(teamList.map(async (team) => {
            const [totalTasks] = await drizzle_1.db
                .select({ count: (0, drizzle_orm_1.count)() })
                .from(schema_1.tasks)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.tasks.workspaceId, workspaceId), (0, drizzle_orm_1.eq)(schema_1.tasks.teamId, team.id)));
            const [completedTasks] = await drizzle_1.db
                .select({ count: (0, drizzle_orm_1.count)() })
                .from(schema_1.tasks)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.tasks.workspaceId, workspaceId), (0, drizzle_orm_1.eq)(schema_1.tasks.teamId, team.id), (0, drizzle_orm_1.eq)(schema_1.tasks.status, "DONE")));
            const [activeTasks] = await drizzle_1.db
                .select({ count: (0, drizzle_orm_1.count)() })
                .from(schema_1.tasks)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.tasks.workspaceId, workspaceId), (0, drizzle_orm_1.eq)(schema_1.tasks.teamId, team.id), (0, drizzle_orm_1.ne)(schema_1.tasks.status, "DONE"), (0, drizzle_orm_1.ne)(schema_1.tasks.status, "CANCELLED")));
            const [overdueTasks] = await drizzle_1.db
                .select({ count: (0, drizzle_orm_1.count)() })
                .from(schema_1.tasks)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.tasks.workspaceId, workspaceId), (0, drizzle_orm_1.eq)(schema_1.tasks.teamId, team.id), (0, drizzle_orm_1.ne)(schema_1.tasks.status, "DONE"), (0, drizzle_orm_1.ne)(schema_1.tasks.status, "CANCELLED"), (0, drizzle_orm_1.sql) `${schema_1.tasks.dueDate} IS NOT NULL AND ${schema_1.tasks.dueDate} < NOW()`));
            const [memberCount] = await drizzle_1.db
                .select({ count: (0, drizzle_orm_1.count)() })
                .from(schema_1.workspaceMembers)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.workspaceMembers.workspaceId, workspaceId), (0, drizzle_orm_1.eq)(schema_1.workspaceMembers.teamId, team.id)));
            return {
                name: team.name || "Unknown",
                totalTasks: totalTasks?.count || 0,
                completedTasks: completedTasks?.count || 0,
                activeTasks: activeTasks?.count || 0,
                overdueTasks: overdueTasks?.count || 0,
                memberCount: memberCount?.count || 0,
                completionRate: totalTasks?.count
                    ? Math.round(((completedTasks?.count || 0) / totalTasks.count) * 100)
                    : 0,
            };
        }));
        return workload.sort((a, b) => b.totalTasks - a.totalTasks);
    }
    async getTeamCompletionRate(workspaceId, dateFrom, dateTo) {
        // ... (unchanged)
        const teamList = await drizzle_1.db
            .select({ id: schema_1.teams.id, name: schema_1.teams.name })
            .from(schema_1.teams)
            .where((0, drizzle_orm_1.eq)(schema_1.teams.workspaceId, workspaceId));
        const rates = await Promise.all(teamList.map(async (team) => {
            const [total] = await drizzle_1.db
                .select({ count: (0, drizzle_orm_1.count)() })
                .from(schema_1.tasks)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.tasks.workspaceId, workspaceId), (0, drizzle_orm_1.eq)(schema_1.tasks.teamId, team.id)));
            const [completed] = await drizzle_1.db
                .select({ count: (0, drizzle_orm_1.count)() })
                .from(schema_1.tasks)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.tasks.workspaceId, workspaceId), (0, drizzle_orm_1.eq)(schema_1.tasks.teamId, team.id), (0, drizzle_orm_1.eq)(schema_1.tasks.status, "DONE")));
            const [onTime] = await drizzle_1.db
                .select({ count: (0, drizzle_orm_1.count)() })
                .from(schema_1.tasks)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.tasks.workspaceId, workspaceId), (0, drizzle_orm_1.eq)(schema_1.tasks.teamId, team.id), (0, drizzle_orm_1.eq)(schema_1.tasks.status, "DONE"), (0, drizzle_orm_1.sql) `${schema_1.tasks.dueDate} IS NOT NULL AND ${schema_1.tasks.updatedAt} <= ${schema_1.tasks.dueDate}`));
            return {
                name: team.name || "Unknown",
                total: total?.count || 0,
                completed: completed?.count || 0,
                onTime: onTime?.count || 0,
                completionRate: total?.count
                    ? Math.round(((completed?.count || 0) / total.count) * 100)
                    : 0,
                onTimeRate: completed?.count
                    ? Math.round(((onTime?.count || 0) / completed.count) * 100)
                    : 0,
            };
        }));
        return rates.sort((a, b) => b.completionRate - a.completionRate);
    }
    async getPriorityTrends(workspaceId, dateFrom, dateTo) {
        // ... (unchanged)
        const now = new Date();
        const endDate = dateTo
            ? new Date(dateTo + "T23:59:59.999")
            : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        const startDate = dateFrom
            ? new Date(dateFrom + "T00:00:00.000")
            : new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        const teamList = await drizzle_1.db
            .select({ id: schema_1.teams.id, name: schema_1.teams.name })
            .from(schema_1.teams)
            .where((0, drizzle_orm_1.eq)(schema_1.teams.workspaceId, workspaceId));
        const allTasks = await drizzle_1.db
            .select({
            teamId: schema_1.tasks.teamId,
            priority: schema_1.tasks.priority,
            status: schema_1.tasks.status,
        })
            .from(schema_1.tasks)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.tasks.workspaceId, workspaceId), (0, drizzle_orm_1.gte)(schema_1.tasks.createdAt, startDate), (0, drizzle_orm_1.lte)(schema_1.tasks.createdAt, endDate), (0, drizzle_orm_1.sql) `${schema_1.tasks.status} != 'CANCELLED'`));
        const priorityMap = {
            LOW: "Low",
            MEDIUM: "Medium",
            HIGH: "High",
            URGENT: "Urgent",
        };
        const allPriorities = ["LOW", "MEDIUM", "HIGH", "URGENT"];
        return teamList.map((team) => {
            const teamTasks = allTasks.filter((t) => t.teamId === team.id);
            const priorityCounts = {};
            allPriorities.forEach((p) => {
                priorityCounts[p] = 0;
            });
            teamTasks.forEach((task) => {
                const priority = task.priority || "LOW";
                if (priorityCounts[priority] !== undefined)
                    priorityCounts[priority]++;
            });
            return {
                team: team.name || "Unknown",
                priorities: allPriorities.map((priority) => ({
                    name: priorityMap[priority] || priority,
                    value: priorityCounts[priority] || 0,
                })),
            };
        });
    }
    async getAttendanceTrend(workspaceId, dateFrom, dateTo) {
        // ... (unchanged)
        const now = new Date();
        const endDate = dateTo
            ? new Date(dateTo + "T23:59:59.999")
            : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        const startDate = dateFrom
            ? new Date(dateFrom + "T00:00:00.000")
            : new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        const records = await drizzle_1.db
            .select({
            date: schema_1.attendance.date,
            status: schema_1.attendance.status,
            employeeId: schema_1.attendance.userId,
        })
            .from(schema_1.attendance)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.attendance.workspaceId, workspaceId), (0, drizzle_orm_1.gte)(schema_1.attendance.date, startDate), (0, drizzle_orm_1.lte)(schema_1.attendance.date, endDate)))
            .orderBy(schema_1.attendance.date);
        const dateMap = new Map();
        records.forEach((r) => {
            const dateKey = new Date(r.date).toISOString().split("T")[0];
            if (!dateMap.has(dateKey))
                dateMap.set(dateKey, {
                    present: 0,
                    absent: 0,
                    late: 0,
                    halfDay: 0,
                    onLeave: 0,
                });
            const entry = dateMap.get(dateKey);
            const status = (r.status || "").toUpperCase().trim();
            if (status === "PRESENT")
                entry.present++;
            else if (status === "ABSENT")
                entry.absent++;
            else if (status === "LATE")
                entry.late++;
            else if (status === "HALF_DAY" || status === "HALFDAY")
                entry.halfDay++;
            else if (status === "ON_LEAVE" ||
                status === "ONLEAVE" ||
                status === "LEAVE")
                entry.onLeave++;
            else
                entry.present++;
        });
        return Array.from(dateMap.entries())
            .map(([date, data]) => ({ date, ...data }))
            .sort((a, b) => a.date.localeCompare(b.date));
    }
    async getEmployeeDistribution(workspaceId) {
        // ... (unchanged)
        const members = await drizzle_1.db
            .select({ team: schema_1.teams.name, employmentType: schema_1.users.employmentType })
            .from(schema_1.users)
            .innerJoin(schema_1.workspaceMembers, (0, drizzle_orm_1.eq)(schema_1.users.id, schema_1.workspaceMembers.userId))
            .leftJoin(schema_1.teams, (0, drizzle_orm_1.eq)(schema_1.workspaceMembers.teamId, schema_1.teams.id))
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.workspaceMembers.workspaceId, workspaceId), (0, drizzle_orm_1.eq)(schema_1.users.isActive, true)));
        const deptMap = new Map();
        members.forEach((m) => {
            const dept = m.team || "No Team";
            if (!deptMap.has(dept))
                deptMap.set(dept, { fullTime: 0, contract: 0, remote: 0, total: 0 });
            const entry = deptMap.get(dept);
            if (m.employmentType === "Full-time")
                entry.fullTime++;
            else if (m.employmentType === "Contract")
                entry.contract++;
            else if (m.employmentType === "Remote")
                entry.remote++;
            entry.total++;
        });
        return Array.from(deptMap.entries()).map(([department, data]) => ({
            department,
            ...data,
        }));
    }
    // ==================== HELPERS ====================
    async buildFilters(workspaceId, memberId, teamId, status, priority) {
        const filters = [(0, drizzle_orm_1.eq)(schema_1.tasks.workspaceId, workspaceId)];
        if (teamId && teamId !== "all") {
            filters.push((0, drizzle_orm_1.eq)(schema_1.tasks.teamId, teamId));
        }
        if (memberId && memberId !== "all") {
            const memberTasks = await drizzle_1.db
                .select({ taskId: schema_1.taskAssignees.taskId })
                .from(schema_1.taskAssignees)
                .where((0, drizzle_orm_1.eq)(schema_1.taskAssignees.userId, memberId));
            const taskIds = memberTasks.map((t) => t.taskId);
            if (taskIds.length > 0) {
                filters.push((0, drizzle_orm_1.inArray)(schema_1.tasks.id, taskIds));
            }
            else {
                filters.push((0, drizzle_orm_1.sql) `1 = 0`);
            }
        }
        if (status && status !== "all") {
            const statusMap = {
                Todo: "TODO",
                "In progress": "IN_PROGRESS",
                Done: "DONE",
                "On Hold": "REVIEW",
                Cancelled: "CANCELLED",
            };
            filters.push((0, drizzle_orm_1.eq)(schema_1.tasks.status, (statusMap[status] || status)));
        }
        if (priority && priority !== "all") {
            const priorityMap = {
                Low: "LOW",
                Medium: "MEDIUM",
                High: "HIGH",
                Urgent: "URGENT",
            };
            filters.push((0, drizzle_orm_1.eq)(schema_1.tasks.priority, (priorityMap[priority] || priority)));
        }
        return filters;
    }
}
exports.AnalyticsService = AnalyticsService;
