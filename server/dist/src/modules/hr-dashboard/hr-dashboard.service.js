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
        // ✅ Use provided dates or default to today
        const todayStart = dateFrom
            ? new Date(dateFrom)
            : new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const todayEnd = dateTo
            ? new Date(dateTo + "T23:59:59")
            : new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const deptFilter = department && department !== "all" ? [(0, drizzle_orm_1.eq)(schema_1.teams.name, department)] : [];
        // Total employees
        const [totalEmp] = await drizzle_1.db
            .select({ count: (0, drizzle_orm_1.count)() })
            .from(schema_1.workspaceMembers)
            .leftJoin(schema_1.teams, (0, drizzle_orm_1.eq)(schema_1.workspaceMembers.teamId, schema_1.teams.id))
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.workspaceMembers.workspaceId, workspaceId), ...deptFilter));
        // Active employees
        const [activeEmp] = await drizzle_1.db
            .select({ count: (0, drizzle_orm_1.count)() })
            .from(schema_1.users)
            .innerJoin(schema_1.workspaceMembers, (0, drizzle_orm_1.eq)(schema_1.users.id, schema_1.workspaceMembers.userId))
            .leftJoin(schema_1.teams, (0, drizzle_orm_1.eq)(schema_1.workspaceMembers.teamId, schema_1.teams.id))
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.workspaceMembers.workspaceId, workspaceId), (0, drizzle_orm_1.eq)(schema_1.users.isActive, true), ...deptFilter));
        // ✅ On Leave - Head Count (unique employees) for the selected date range
        const leaveUserIds = await drizzle_1.db
            .select({ userId: schema_1.leaves.userId })
            .from(schema_1.leaves)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.leaves.workspaceId, workspaceId), (0, drizzle_orm_1.eq)(schema_1.leaves.status, "APPROVED"), (0, drizzle_orm_1.lte)(schema_1.leaves.startDate, todayEnd), (0, drizzle_orm_1.gte)(schema_1.leaves.endDate, todayStart)))
            .groupBy(schema_1.leaves.userId);
        const attendanceLeaveUserIds = await drizzle_1.db
            .select({ userId: schema_1.attendance.userId })
            .from(schema_1.attendance)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.attendance.workspaceId, workspaceId), (0, drizzle_orm_1.eq)(schema_1.attendance.status, "ON_LEAVE"), (0, drizzle_orm_1.gte)(schema_1.attendance.date, todayStart), (0, drizzle_orm_1.lte)(schema_1.attendance.date, todayEnd)))
            .groupBy(schema_1.attendance.userId);
        const onLeaveHeadCount = new Set([
            ...leaveUserIds.map((l) => l.userId),
            ...attendanceLeaveUserIds.map((a) => a.userId),
        ]).size;
        // Present in date range
        const [presentCount] = await drizzle_1.db
            .select({ count: (0, drizzle_orm_1.count)() })
            .from(schema_1.attendance)
            .leftJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.attendance.userId, schema_1.users.id))
            .leftJoin(schema_1.workspaceMembers, (0, drizzle_orm_1.eq)(schema_1.users.id, schema_1.workspaceMembers.userId))
            .leftJoin(schema_1.teams, (0, drizzle_orm_1.eq)(schema_1.workspaceMembers.teamId, schema_1.teams.id))
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.attendance.workspaceId, workspaceId), (0, drizzle_orm_1.gte)(schema_1.attendance.date, todayStart), (0, drizzle_orm_1.lte)(schema_1.attendance.date, todayEnd), (0, drizzle_orm_1.sql) `${schema_1.attendance.status} IN ('PRESENT', 'LATE')`, ...deptFilter));
        // Absent in date range
        const [absentCount] = await drizzle_1.db
            .select({ count: (0, drizzle_orm_1.count)() })
            .from(schema_1.attendance)
            .leftJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.attendance.userId, schema_1.users.id))
            .leftJoin(schema_1.workspaceMembers, (0, drizzle_orm_1.eq)(schema_1.users.id, schema_1.workspaceMembers.userId))
            .leftJoin(schema_1.teams, (0, drizzle_orm_1.eq)(schema_1.workspaceMembers.teamId, schema_1.teams.id))
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.attendance.workspaceId, workspaceId), (0, drizzle_orm_1.gte)(schema_1.attendance.date, todayStart), (0, drizzle_orm_1.lte)(schema_1.attendance.date, todayEnd), (0, drizzle_orm_1.eq)(schema_1.attendance.status, "ABSENT"), ...deptFilter));
        // New hires in date range
        const [newHires] = await drizzle_1.db
            .select({ count: (0, drizzle_orm_1.count)() })
            .from(schema_1.users)
            .innerJoin(schema_1.workspaceMembers, (0, drizzle_orm_1.eq)(schema_1.users.id, schema_1.workspaceMembers.userId))
            .leftJoin(schema_1.teams, (0, drizzle_orm_1.eq)(schema_1.workspaceMembers.teamId, schema_1.teams.id))
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.workspaceMembers.workspaceId, workspaceId), (0, drizzle_orm_1.gte)(schema_1.users.createdAt, todayStart), (0, drizzle_orm_1.lte)(schema_1.users.createdAt, todayEnd), ...deptFilter));
        return {
            totalEmployees: totalEmp?.count || 0,
            activeEmployees: activeEmp?.count || 0,
            onLeave: onLeaveHeadCount,
            presentToday: presentCount?.count || 0,
            absentToday: absentCount?.count || 0,
            newHiresThisMonth: newHires?.count || 0,
        };
    }
    /**
     * Get chart data for HR Dashboard
     */
    async getChartData(workspaceId, department, dateFrom, dateTo) {
        const now = new Date();
        const deptFilter = department && department !== "all" ? [(0, drizzle_orm_1.eq)(schema_1.teams.name, department)] : [];
        // Get total members for percentage calculation
        const [totalMembers] = await drizzle_1.db
            .select({ count: (0, drizzle_orm_1.count)() })
            .from(schema_1.workspaceMembers)
            .leftJoin(schema_1.teams, (0, drizzle_orm_1.eq)(schema_1.workspaceMembers.teamId, schema_1.teams.id))
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.workspaceMembers.workspaceId, workspaceId), ...deptFilter));
        const total = totalMembers?.count || 1;
        // Department distribution
        const departmentDistribution = await drizzle_1.db
            .select({
            department: schema_1.teams.name,
            count: (0, drizzle_orm_1.count)(),
        })
            .from(schema_1.workspaceMembers)
            .leftJoin(schema_1.teams, (0, drizzle_orm_1.eq)(schema_1.workspaceMembers.teamId, schema_1.teams.id))
            .where((0, drizzle_orm_1.eq)(schema_1.workspaceMembers.workspaceId, workspaceId))
            .groupBy(schema_1.teams.name);
        // Attendance trend (last 10 days from the date range)
        const attendanceTrend = [];
        const endDate = dateTo ? new Date(dateTo) : new Date();
        const startDate = dateFrom
            ? new Date(dateFrom)
            : new Date(Date.now() - 9 * 24 * 60 * 60 * 1000);
        // Calculate days between start and end
        const daysDiff = Math.min(9, Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)));
        for (let i = daysDiff; i >= 0; i--) {
            const date = new Date(endDate);
            date.setDate(date.getDate() - i);
            const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
            const [presentData] = await drizzle_1.db
                .select({ count: (0, drizzle_orm_1.count)() })
                .from(schema_1.attendance)
                .leftJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.attendance.userId, schema_1.users.id))
                .leftJoin(schema_1.workspaceMembers, (0, drizzle_orm_1.eq)(schema_1.users.id, schema_1.workspaceMembers.userId))
                .leftJoin(schema_1.teams, (0, drizzle_orm_1.eq)(schema_1.workspaceMembers.teamId, schema_1.teams.id))
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.attendance.workspaceId, workspaceId), (0, drizzle_orm_1.gte)(schema_1.attendance.date, dayStart), (0, drizzle_orm_1.lte)(schema_1.attendance.date, dayEnd), (0, drizzle_orm_1.sql) `${schema_1.attendance.status} IN ('PRESENT', 'LATE')`, ...deptFilter));
            const [absentData] = await drizzle_1.db
                .select({ count: (0, drizzle_orm_1.count)() })
                .from(schema_1.attendance)
                .leftJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.attendance.userId, schema_1.users.id))
                .leftJoin(schema_1.workspaceMembers, (0, drizzle_orm_1.eq)(schema_1.users.id, schema_1.workspaceMembers.userId))
                .leftJoin(schema_1.teams, (0, drizzle_orm_1.eq)(schema_1.workspaceMembers.teamId, schema_1.teams.id))
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.attendance.workspaceId, workspaceId), (0, drizzle_orm_1.gte)(schema_1.attendance.date, dayStart), (0, drizzle_orm_1.lte)(schema_1.attendance.date, dayEnd), (0, drizzle_orm_1.eq)(schema_1.attendance.status, "ABSENT"), ...deptFilter));
            const presentCount = presentData?.count || 0;
            attendanceTrend.push({
                date: date.toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                }),
                present: presentCount,
                absent: absentData?.count || 0,
                total: total,
                percentage: total > 0 ? Math.round((presentCount / total) * 100) : 0,
            });
        }
        // Leave trend (last 6 months) - Head Count
        const leaveTrend = [];
        for (let i = 5; i >= 0; i--) {
            const monthStart = new Date(new Date().getFullYear(), new Date().getMonth() - i, 1);
            const monthEnd = new Date(new Date().getFullYear(), new Date().getMonth() - i + 1, 0, 23, 59, 59);
            const leaveUserIds = await drizzle_1.db
                .select({ userId: schema_1.leaves.userId })
                .from(schema_1.leaves)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.leaves.workspaceId, workspaceId), (0, drizzle_orm_1.eq)(schema_1.leaves.status, "APPROVED"), (0, drizzle_orm_1.lte)(schema_1.leaves.startDate, monthEnd), (0, drizzle_orm_1.gte)(schema_1.leaves.endDate, monthStart)));
            const attendanceUserIds = await drizzle_1.db
                .select({ userId: schema_1.attendance.userId })
                .from(schema_1.attendance)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.attendance.workspaceId, workspaceId), (0, drizzle_orm_1.eq)(schema_1.attendance.status, "ON_LEAVE"), (0, drizzle_orm_1.gte)(schema_1.attendance.date, monthStart), (0, drizzle_orm_1.lte)(schema_1.attendance.date, monthEnd)));
            const uniqueUserIds = new Set([
                ...leaveUserIds.map((l) => l.userId),
                ...attendanceUserIds.map((a) => a.userId),
            ]);
            leaveTrend.push({
                month: monthStart.toLocaleDateString("en-GB", { month: "short" }),
                count: uniqueUserIds.size,
            });
        }
        return {
            departmentDistribution: departmentDistribution.map((d) => ({
                department: d.department || "No Team",
                count: d.count,
            })),
            attendanceTrend,
            leaveTrend,
        };
    }
    /**
     * Get employee lists by status
     */
    async getEmployeeLists(workspaceId, department) {
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
        const deptFilter = department && department !== "all" ? [(0, drizzle_orm_1.eq)(schema_1.teams.name, department)] : [];
        // Get all workspace members
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
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.workspaceMembers.workspaceId, workspaceId), (0, drizzle_orm_1.eq)(schema_1.users.isActive, true), ...deptFilter));
        // Get today's attendance
        const todayAttendance = await drizzle_1.db
            .select({ userId: schema_1.attendance.userId, status: schema_1.attendance.status })
            .from(schema_1.attendance)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.attendance.workspaceId, workspaceId), (0, drizzle_orm_1.gte)(schema_1.attendance.date, todayStart), (0, drizzle_orm_1.lte)(schema_1.attendance.date, todayEnd)));
        const attendanceMap = new Map(todayAttendance.map((a) => [a.userId, a.status]));
        // Get today's on-leave users
        const todayLeaves = await drizzle_1.db
            .select({ userId: schema_1.leaves.userId })
            .from(schema_1.leaves)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.leaves.workspaceId, workspaceId), (0, drizzle_orm_1.eq)(schema_1.leaves.status, "APPROVED"), (0, drizzle_orm_1.lte)(schema_1.leaves.startDate, todayEnd), (0, drizzle_orm_1.gte)(schema_1.leaves.endDate, todayStart)));
        const todayAttendanceLeave = await drizzle_1.db
            .select({ userId: schema_1.attendance.userId })
            .from(schema_1.attendance)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.attendance.workspaceId, workspaceId), (0, drizzle_orm_1.eq)(schema_1.attendance.status, "ON_LEAVE"), (0, drizzle_orm_1.gte)(schema_1.attendance.date, todayStart), (0, drizzle_orm_1.lte)(schema_1.attendance.date, todayEnd)));
        const leaveSet = new Set([
            ...todayLeaves.map((l) => l.userId),
            ...todayAttendanceLeave.map((a) => a.userId),
        ]);
        // Categorize employees
        const present = [];
        const absent = [];
        const onLeave = [];
        const halfDay = [];
        members.forEach((member) => {
            const attStatus = attendanceMap.get(member.id);
            const isOnLeave = leaveSet.has(member.id);
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
                status: isOnLeave
                    ? "onleave"
                    : attStatus === "PRESENT" || attStatus === "LATE"
                        ? "present"
                        : attStatus === "HALF_DAY"
                            ? "halfDay"
                            : attStatus === "ABSENT"
                                ? "absent"
                                : "present",
            };
            if (isOnLeave)
                onLeave.push(employee);
            else if (attStatus === "HALF_DAY")
                halfDay.push(employee);
            else if (attStatus === "ABSENT")
                absent.push(employee);
            else
                present.push(employee);
        });
        return { present, absent, onLeave, halfDay };
    }
}
exports.HRDashboardService = HRDashboardService;
