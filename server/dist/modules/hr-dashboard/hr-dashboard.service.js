"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HRDashboardService = void 0;
// src/modules/hr-dashboard/hr-dashboard.service.ts
const drizzle_1 = require("../../db/drizzle");
const schema_1 = require("../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
class HRDashboardService {
    /**
     * Get KPI numbers for HR Dashboard
     */
    async getKPIData(workspaceId, department, dateFrom, dateTo) {
        const now = new Date();
        const todayStart = dateFrom
            ? new Date(dateFrom + "T00:00:00.000")
            : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const todayEnd = dateTo
            ? new Date(dateTo + "T23:59:59.999")
            : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        const deptFilter = department && department !== "all" ? [(0, drizzle_orm_1.eq)(schema_1.teams.name, department)] : [];
        // Total employees
        const [totalEmp] = await drizzle_1.db
            .select({ count: (0, drizzle_orm_1.count)() })
            .from(schema_1.workspaceMembers)
            .leftJoin(schema_1.teams, (0, drizzle_orm_1.eq)(schema_1.workspaceMembers.teamId, schema_1.teams.id))
            .leftJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.workspaceMembers.userId, schema_1.users.id))
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.workspaceMembers.workspaceId, workspaceId), (0, drizzle_orm_1.eq)(schema_1.users.isActive, true), ...deptFilter));
        // Active employees
        const [activeEmp] = await drizzle_1.db
            .select({ count: (0, drizzle_orm_1.count)() })
            .from(schema_1.users)
            .innerJoin(schema_1.workspaceMembers, (0, drizzle_orm_1.eq)(schema_1.users.id, schema_1.workspaceMembers.userId))
            .leftJoin(schema_1.teams, (0, drizzle_orm_1.eq)(schema_1.workspaceMembers.teamId, schema_1.teams.id))
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.workspaceMembers.workspaceId, workspaceId), (0, drizzle_orm_1.eq)(schema_1.users.isActive, true), ...deptFilter));
        // On Leave - Get unique users on leave for the selected date
        const leaveUserIds = await drizzle_1.db
            .selectDistinct({ userId: schema_1.leaves.userId })
            .from(schema_1.leaves)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.leaves.workspaceId, workspaceId), (0, drizzle_orm_1.eq)(schema_1.leaves.status, "APPROVED"), (0, drizzle_orm_1.lte)(schema_1.leaves.startDate, todayEnd), (0, drizzle_orm_1.gte)(schema_1.leaves.endDate, todayStart)));
        const attendanceLeaveUserIds = await drizzle_1.db
            .selectDistinct({ userId: schema_1.attendance.userId })
            .from(schema_1.attendance)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.attendance.workspaceId, workspaceId), (0, drizzle_orm_1.eq)(schema_1.attendance.status, "ON_LEAVE"), (0, drizzle_orm_1.gte)(schema_1.attendance.date, todayStart), (0, drizzle_orm_1.lte)(schema_1.attendance.date, todayEnd)));
        const onLeaveUserIds = new Set([
            ...leaveUserIds.map((l) => l.userId),
            ...attendanceLeaveUserIds.map((a) => a.userId),
        ]);
        // Present Today
        const presentUserIds = await drizzle_1.db
            .selectDistinct({ userId: schema_1.attendance.userId })
            .from(schema_1.attendance)
            .leftJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.attendance.userId, schema_1.users.id))
            .leftJoin(schema_1.workspaceMembers, (0, drizzle_orm_1.eq)(schema_1.users.id, schema_1.workspaceMembers.userId))
            .leftJoin(schema_1.teams, (0, drizzle_orm_1.eq)(schema_1.workspaceMembers.teamId, schema_1.teams.id))
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.attendance.workspaceId, workspaceId), (0, drizzle_orm_1.gte)(schema_1.attendance.date, todayStart), (0, drizzle_orm_1.lte)(schema_1.attendance.date, todayEnd), (0, drizzle_orm_1.sql) `${schema_1.attendance.status} IN ('PRESENT', 'LATE')`, ...deptFilter));
        const presentCount = presentUserIds.filter((p) => !onLeaveUserIds.has(p.userId)).length;
        // Absent Today
        const absentUserIds = await drizzle_1.db
            .selectDistinct({ userId: schema_1.attendance.userId })
            .from(schema_1.attendance)
            .leftJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.attendance.userId, schema_1.users.id))
            .leftJoin(schema_1.workspaceMembers, (0, drizzle_orm_1.eq)(schema_1.users.id, schema_1.workspaceMembers.userId))
            .leftJoin(schema_1.teams, (0, drizzle_orm_1.eq)(schema_1.workspaceMembers.teamId, schema_1.teams.id))
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.attendance.workspaceId, workspaceId), (0, drizzle_orm_1.gte)(schema_1.attendance.date, todayStart), (0, drizzle_orm_1.lte)(schema_1.attendance.date, todayEnd), (0, drizzle_orm_1.eq)(schema_1.attendance.status, "ABSENT"), ...deptFilter));
        const absentCount = absentUserIds.length;
        // New hires in date range
        const [newHires] = await drizzle_1.db
            .select({ count: (0, drizzle_orm_1.count)() })
            .from(schema_1.users)
            .innerJoin(schema_1.workspaceMembers, (0, drizzle_orm_1.eq)(schema_1.users.id, schema_1.workspaceMembers.userId))
            .leftJoin(schema_1.teams, (0, drizzle_orm_1.eq)(schema_1.workspaceMembers.teamId, schema_1.teams.id))
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.workspaceMembers.workspaceId, workspaceId), (0, drizzle_orm_1.gte)(schema_1.users.createdAt, todayStart), (0, drizzle_orm_1.lte)(schema_1.users.createdAt, todayEnd), ...deptFilter));
        console.log("HR KPI Data:", {
            totalEmployees: totalEmp?.count || 0,
            activeEmployees: activeEmp?.count || 0,
            onLeave: onLeaveUserIds.size,
            presentToday: presentCount,
            absentToday: absentCount,
        });
        return {
            totalEmployees: totalEmp?.count || 0,
            activeEmployees: activeEmp?.count || 0,
            onLeave: onLeaveUserIds.size,
            presentToday: presentCount,
            absentToday: absentCount,
            newHiresThisMonth: newHires?.count || 0,
        };
    }
    /**
     * Get chart data for HR Dashboard
     */
    async getChartData(workspaceId, department, dateFrom, dateTo) {
        const now = new Date();
        const deptFilter = department && department !== "all" ? [(0, drizzle_orm_1.eq)(schema_1.teams.name, department)] : [];
        // FIXED: Fetch dynamic leave types from database
        const workspaceLeaveTypes = await drizzle_1.db
            .select()
            .from(schema_1.leaveTypes)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.leaveTypes.workspaceId, workspaceId), (0, drizzle_orm_1.eq)(schema_1.leaveTypes.isActive, true)));
        console.log("Workspace Leave Types:", JSON.stringify(workspaceLeaveTypes, null, 2));
        // Build color map and name map from workspace leave types
        const leaveTypeColorMap = {};
        const leaveTypeIdToNameMap = {};
        workspaceLeaveTypes.forEach((lt) => {
            leaveTypeColorMap[lt.name] = lt.color;
            leaveTypeIdToNameMap[lt.id] = lt.name;
            // Also store by ID for fallback
            leaveTypeColorMap[lt.id] = lt.color;
        });
        // Default colors for fallback
        const defaultColors = [
            "#3b82f6",
            "#ef4444",
            "#f59e0b",
            "#10b981",
            "#8b5cf6",
            "#ec4899",
            "#06b6d4",
            "#f97316",
        ];
        // Get total active members
        const [totalMembers] = await drizzle_1.db
            .select({ count: (0, drizzle_orm_1.count)() })
            .from(schema_1.workspaceMembers)
            .leftJoin(schema_1.teams, (0, drizzle_orm_1.eq)(schema_1.workspaceMembers.teamId, schema_1.teams.id))
            .leftJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.workspaceMembers.userId, schema_1.users.id))
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.workspaceMembers.workspaceId, workspaceId), (0, drizzle_orm_1.eq)(schema_1.users.isActive, true), ...deptFilter));
        const total = totalMembers?.count || 1;
        // Today's date range
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        // Department distribution
        const departmentDistribution = await drizzle_1.db
            .select({
            department: schema_1.teams.name,
            count: (0, drizzle_orm_1.count)(),
        })
            .from(schema_1.workspaceMembers)
            .leftJoin(schema_1.teams, (0, drizzle_orm_1.eq)(schema_1.workspaceMembers.teamId, schema_1.teams.id))
            .leftJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.workspaceMembers.userId, schema_1.users.id))
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.workspaceMembers.workspaceId, workspaceId), (0, drizzle_orm_1.eq)(schema_1.users.isActive, true)))
            .groupBy(schema_1.teams.name);
        // Attendance trend
        const endDate = dateTo ? new Date(dateTo + "T23:59:59.999") : new Date();
        const startDate = dateFrom
            ? new Date(dateFrom + "T00:00:00.000")
            : new Date(Date.now() - 9 * 24 * 60 * 60 * 1000);
        startDate.setHours(0, 0, 0, 0);
        const daysDiff = Math.min(30, Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)));
        const attendanceTrend = [];
        for (let i = daysDiff; i >= 0; i--) {
            const date = new Date(endDate);
            date.setDate(date.getDate() - i);
            const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
            const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
            const presentUsers = await drizzle_1.db
                .selectDistinct({ userId: schema_1.attendance.userId })
                .from(schema_1.attendance)
                .leftJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.attendance.userId, schema_1.users.id))
                .leftJoin(schema_1.workspaceMembers, (0, drizzle_orm_1.eq)(schema_1.users.id, schema_1.workspaceMembers.userId))
                .leftJoin(schema_1.teams, (0, drizzle_orm_1.eq)(schema_1.workspaceMembers.teamId, schema_1.teams.id))
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.attendance.workspaceId, workspaceId), (0, drizzle_orm_1.gte)(schema_1.attendance.date, dayStart), (0, drizzle_orm_1.lte)(schema_1.attendance.date, dayEnd), (0, drizzle_orm_1.sql) `${schema_1.attendance.status} IN ('PRESENT', 'LATE')`, ...deptFilter));
            const absentUsers = await drizzle_1.db
                .selectDistinct({ userId: schema_1.attendance.userId })
                .from(schema_1.attendance)
                .leftJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.attendance.userId, schema_1.users.id))
                .leftJoin(schema_1.workspaceMembers, (0, drizzle_orm_1.eq)(schema_1.users.id, schema_1.workspaceMembers.userId))
                .leftJoin(schema_1.teams, (0, drizzle_orm_1.eq)(schema_1.workspaceMembers.teamId, schema_1.teams.id))
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.attendance.workspaceId, workspaceId), (0, drizzle_orm_1.gte)(schema_1.attendance.date, dayStart), (0, drizzle_orm_1.lte)(schema_1.attendance.date, dayEnd), (0, drizzle_orm_1.eq)(schema_1.attendance.status, "ABSENT"), ...deptFilter));
            const presentCount = presentUsers.length;
            const percentage = total > 0 ? Math.round((presentCount / total) * 100) : 0;
            attendanceTrend.push({
                date: date.toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                }),
                present: presentCount,
                absent: absentUsers.length,
                total: total,
                percentage: percentage,
            });
        }
        // ============ DYNAMIC LEAVE DISTRIBUTION ============
        // FIXED: Today's leave types with proper JOIN to leaveTypes table
        const todayLeavesData = await drizzle_1.db
            .select({
            leaveTypeId: schema_1.leaves.leaveTypeId,
            leaveTypeName: schema_1.leaveTypes.name,
            leaveTypeColor: schema_1.leaveTypes.color,
            userId: schema_1.leaves.userId,
        })
            .from(schema_1.leaves)
            .leftJoin(schema_1.leaveTypes, (0, drizzle_orm_1.eq)(schema_1.leaves.leaveTypeId, schema_1.leaveTypes.id))
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.leaves.workspaceId, workspaceId), (0, drizzle_orm_1.eq)(schema_1.leaves.status, "APPROVED"), (0, drizzle_orm_1.lte)(schema_1.leaves.startDate, todayEnd), (0, drizzle_orm_1.gte)(schema_1.leaves.endDate, todayStart)));
        console.log("Today's Leave Data:", JSON.stringify(todayLeavesData, null, 2));
        // Group today's leaves by leave type name
        const todayLeaveTypeMap = new Map();
        let fallbackColorIndex = 0;
        todayLeavesData.forEach((leave) => {
            // Use the actual name from the join, or fallback to ID mapping, then to "Other"
            let typeName = leave.leaveTypeName ||
                leaveTypeIdToNameMap[leave.leaveTypeId || ""] ||
                "Other";
            let color = leave.leaveTypeColor ||
                leaveTypeColorMap[typeName] ||
                defaultColors[fallbackColorIndex % defaultColors.length];
            if (!leave.leaveTypeColor && !leaveTypeColorMap[typeName]) {
                fallbackColorIndex++;
            }
            if (!todayLeaveTypeMap.has(typeName)) {
                todayLeaveTypeMap.set(typeName, {
                    userIds: new Set(),
                    color: color,
                });
            }
            todayLeaveTypeMap.get(typeName).userIds.add(leave.userId);
        });
        // Build today's leave types array
        const todayLeaveTypes = [];
        todayLeaveTypeMap.forEach((data, typeName) => {
            todayLeaveTypes.push({
                type: typeName,
                count: data.userIds.size,
                color: data.color,
            });
        });
        const todayLeaveCount = new Set(todayLeavesData.map((l) => l.userId)).size;
        console.log("Today Leave Types:", JSON.stringify(todayLeaveTypes, null, 2));
        console.log("Today Leave Count:", todayLeaveCount);
        // FIXED: Monthly leave trend with proper JOIN
        const monthlyLeaveTrend = [];
        for (let i = 5; i >= 0; i--) {
            const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1, 0, 0, 0, 0);
            const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
            const monthLeaves = await drizzle_1.db
                .select({
                leaveTypeId: schema_1.leaves.leaveTypeId,
                leaveTypeName: schema_1.leaveTypes.name,
                leaveTypeColor: schema_1.leaveTypes.color,
                userId: schema_1.leaves.userId,
            })
                .from(schema_1.leaves)
                .leftJoin(schema_1.leaveTypes, (0, drizzle_orm_1.eq)(schema_1.leaves.leaveTypeId, schema_1.leaveTypes.id))
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.leaves.workspaceId, workspaceId), (0, drizzle_orm_1.eq)(schema_1.leaves.status, "APPROVED"), (0, drizzle_orm_1.lte)(schema_1.leaves.startDate, monthEnd), (0, drizzle_orm_1.gte)(schema_1.leaves.endDate, monthStart)));
            // Count unique employees per leave type
            const typeUserMap = new Map();
            monthLeaves.forEach((leave) => {
                const typeName = leave.leaveTypeName ||
                    leaveTypeIdToNameMap[leave.leaveTypeId || ""] ||
                    "Other";
                if (!typeUserMap.has(typeName)) {
                    typeUserMap.set(typeName, new Set());
                }
                typeUserMap.get(typeName).add(leave.userId);
            });
            // Build month entry with dynamic leave type counts
            const monthEntry = {
                month: monthStart.toLocaleDateString("en-GB", { month: "short" }),
            };
            let totalForMonth = 0;
            // Initialize all active leave types with 0
            workspaceLeaveTypes.forEach((lt) => {
                const userSet = typeUserMap.get(lt.name) || new Set();
                monthEntry[lt.name] = userSet.size;
                totalForMonth += userSet.size;
            });
            // Add any unknown leave types found in data
            typeUserMap.forEach((userIds, typeName) => {
                if (!monthEntry.hasOwnProperty(typeName)) {
                    monthEntry[typeName] = userIds.size;
                    totalForMonth += userIds.size;
                }
            });
            monthEntry.total = totalForMonth;
            monthlyLeaveTrend.push(monthEntry);
        }
        console.log("Monthly Leave Trend:", JSON.stringify(monthlyLeaveTrend, null, 2));
        // Get all unique leave type names
        const allLeaveTypeNames = workspaceLeaveTypes.map((lt) => lt.name);
        // Also include any types found in data but not in workspace config
        monthlyLeaveTrend.forEach((month) => {
            Object.keys(month).forEach((key) => {
                if (key !== "month" &&
                    key !== "total" &&
                    !allLeaveTypeNames.includes(key)) {
                    allLeaveTypeNames.push(key);
                    // Assign a color if not already mapped
                    if (!leaveTypeColorMap[key]) {
                        leaveTypeColorMap[key] =
                            defaultColors[allLeaveTypeNames.length % defaultColors.length];
                    }
                }
            });
        });
        console.log("All Leave Type Names:", allLeaveTypeNames);
        console.log("Leave Type Colors:", leaveTypeColorMap);
        return {
            departmentDistribution: departmentDistribution.map((d) => ({
                department: d.department || "No Team",
                count: d.count,
            })),
            attendanceTrend,
            leaveByType: todayLeaveTypes,
            monthlyLeaveTrend,
            todayLeaveCount,
            todayLeaveTypes,
            leaveTypeNames: allLeaveTypeNames,
            leaveTypeColors: leaveTypeColorMap,
        };
    }
    /**
     * Get employee lists by status
     */
    async getEmployeeLists(workspaceId, department, memberId, dateFrom, dateTo) {
        const now = new Date();
        const todayStart = dateFrom
            ? new Date(dateFrom + "T00:00:00.000")
            : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const todayEnd = dateTo
            ? new Date(dateTo + "T23:59:59.999")
            : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        const deptFilter = department && department !== "all" ? [(0, drizzle_orm_1.eq)(schema_1.teams.name, department)] : [];
        const memberFilter = memberId && memberId !== "all" ? [(0, drizzle_orm_1.eq)(schema_1.users.id, memberId)] : [];
        const members = await drizzle_1.db
            .select({
            id: schema_1.users.id,
            name: schema_1.users.name,
            email: schema_1.users.email,
            avatar: schema_1.users.avatar,
            department: schema_1.teams.name,
            role: schema_1.roles.name,
        })
            .from(schema_1.users)
            .innerJoin(schema_1.workspaceMembers, (0, drizzle_orm_1.eq)(schema_1.users.id, schema_1.workspaceMembers.userId))
            .leftJoin(schema_1.teams, (0, drizzle_orm_1.eq)(schema_1.workspaceMembers.teamId, schema_1.teams.id))
            .leftJoin(schema_1.roles, (0, drizzle_orm_1.eq)(schema_1.workspaceMembers.roleId, schema_1.roles.id))
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.workspaceMembers.workspaceId, workspaceId), (0, drizzle_orm_1.eq)(schema_1.users.isActive, true), ...deptFilter, ...memberFilter));
        const todayAttendance = await drizzle_1.db
            .select({ userId: schema_1.attendance.userId, status: schema_1.attendance.status })
            .from(schema_1.attendance)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.attendance.workspaceId, workspaceId), (0, drizzle_orm_1.gte)(schema_1.attendance.date, todayStart), (0, drizzle_orm_1.lte)(schema_1.attendance.date, todayEnd)));
        const attendanceMap = new Map();
        todayAttendance.forEach((a) => {
            if (!attendanceMap.has(a.userId)) {
                attendanceMap.set(a.userId, a.status);
            }
        });
        const todayLeaves = await drizzle_1.db
            .selectDistinct({ userId: schema_1.leaves.userId })
            .from(schema_1.leaves)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.leaves.workspaceId, workspaceId), (0, drizzle_orm_1.eq)(schema_1.leaves.status, "APPROVED"), (0, drizzle_orm_1.lte)(schema_1.leaves.startDate, todayEnd), (0, drizzle_orm_1.gte)(schema_1.leaves.endDate, todayStart)));
        const leaveSet = new Set(todayLeaves.map((l) => l.userId));
        const present = [];
        const absent = [];
        const onLeave = [];
        const halfDay = [];
        const notMarked = [];
        members.forEach((member) => {
            const attStatus = attendanceMap.get(member.id);
            const isOnLeave = leaveSet.has(member.id);
            let status;
            if (isOnLeave) {
                status = "onleave";
            }
            else if (attStatus === "PRESENT" || attStatus === "LATE") {
                status = "present";
            }
            else if (attStatus === "HALF_DAY") {
                status = "halfDay";
            }
            else if (attStatus === "ABSENT") {
                status = "absent";
            }
            else if (attStatus === "ON_LEAVE") {
                status = "onleave";
            }
            else {
                status = "notMarked";
            }
            const employee = {
                id: member.id,
                name: member.name || "Unknown",
                email: member.email || "",
                department: member.department || "N/A",
                role: member.role || "N/A",
                avatar: member.avatar,
                initials: member.name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2) || "?",
                status,
            };
            if (status === "onleave")
                onLeave.push(employee);
            else if (status === "halfDay")
                halfDay.push(employee);
            else if (status === "absent")
                absent.push(employee);
            else if (status === "present")
                present.push(employee);
            else
                notMarked.push(employee);
        });
        return { present, absent, onLeave, halfDay, notMarked };
    }
}
exports.HRDashboardService = HRDashboardService;
