"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HRCalendarService = void 0;
// src/modules/hr-calendar/hr-calendar.service.ts
const drizzle_1 = require("../../db/drizzle");
const schema_1 = require("../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
class HRCalendarService {
    /**
     * Get all HR calendar events for a workspace
     */
    async getHREvents(workspaceId, userId, userPermissions, userTeamId, month, year) {
        const now = new Date();
        const targetMonth = month || now.getMonth() + 1;
        const targetYear = year || now.getFullYear();
        const startDate = new Date(targetYear, targetMonth - 1, 1);
        const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);
        const canManageAll = userPermissions.includes("user_management") ||
            userPermissions.includes("hr_calendar");
        // HR Calendar: Only accessible by user_management OR hr_calendar
        if (!canManageAll) {
            return {
                attendance: [],
                leaves: [],
                holidays: [],
                hasAccess: false,
            };
        }
        // HR Calendar: Show ALL data (no team filtering for admins/HR)
        const attendanceEvents = await this.getDailyAttendanceSummary(workspaceId, userId, startDate, endDate, true, []);
        const leaveEvents = await this.getLeaveEvents(workspaceId, userId, startDate, endDate, true, []);
        const holidayEvents = await this.getHolidayEvents(targetMonth, targetYear);
        return {
            attendance: attendanceEvents,
            leaves: leaveEvents,
            holidays: holidayEvents,
            hasAccess: true,
        };
    }
    /**
     * Get daily attendance summary for each day of the month (filtered by permissions)
     */
    async getDailyAttendanceSummary(workspaceId, userId, startDate, endDate, canManageAll, teamMemberIds) {
        // Build conditions with permission filtering
        const memberConditions = [
            (0, drizzle_orm_1.eq)(schema_1.workspaceMembers.workspaceId, workspaceId),
        ];
        if (!canManageAll) {
            if (teamMemberIds.length > 0) {
                memberConditions.push((0, drizzle_orm_1.inArray)(schema_1.workspaceMembers.userId, teamMemberIds));
            }
            else {
                memberConditions.push((0, drizzle_orm_1.eq)(schema_1.workspaceMembers.userId, userId));
            }
        }
        // Get total members (filtered by permissions)
        const [totalMembers] = await drizzle_1.db
            .select({ count: (0, drizzle_orm_1.count)() })
            .from(schema_1.workspaceMembers)
            .where((0, drizzle_orm_1.and)(...memberConditions));
        const total = totalMembers?.count || 0;
        // Build attendance conditions with same permission filter
        const attendanceConditions = [
            (0, drizzle_orm_1.eq)(schema_1.attendance.workspaceId, workspaceId),
            (0, drizzle_orm_1.gte)(schema_1.attendance.date, startDate),
            (0, drizzle_orm_1.lte)(schema_1.attendance.date, endDate),
        ];
        if (!canManageAll) {
            if (teamMemberIds.length > 0) {
                attendanceConditions.push((0, drizzle_orm_1.inArray)(schema_1.attendance.userId, teamMemberIds));
            }
            else {
                attendanceConditions.push((0, drizzle_orm_1.eq)(schema_1.attendance.userId, userId));
            }
        }
        // Get all attendance records for the month
        const records = await drizzle_1.db
            .select({
            date: schema_1.attendance.date,
            status: schema_1.attendance.status,
        })
            .from(schema_1.attendance)
            .where((0, drizzle_orm_1.and)(...attendanceConditions));
        // Group by date
        const dateMap = new Map();
        records.forEach((record) => {
            const dateKey = new Date(record.date).toISOString().split("T")[0];
            if (!dateMap.has(dateKey)) {
                dateMap.set(dateKey, { present: 0, absent: 0, onLeave: 0, halfDay: 0 });
            }
            const stats = dateMap.get(dateKey);
            switch (record.status) {
                case "PRESENT":
                case "LATE":
                    stats.present++;
                    break;
                case "ABSENT":
                    stats.absent++;
                    break;
                case "ON_LEAVE":
                    stats.onLeave++;
                    break;
                case "HALF_DAY":
                    stats.halfDay++;
                    break;
            }
        });
        // Convert to events
        const events = [];
        dateMap.forEach((stats, dateKey) => {
            const attendancePercentage = total > 0
                ? Math.round(((stats.present + stats.halfDay) / total) * 100)
                : 0;
            let backgroundColor = "#10b981"; // Green for good attendance
            if (attendancePercentage < 60) {
                backgroundColor = "#ef4444"; // Red for low attendance
            }
            else if (attendancePercentage < 80) {
                backgroundColor = "#f59e0b"; // Amber for moderate attendance
            }
            events.push({
                id: `att-${dateKey}`,
                title: attendancePercentage < 80
                    ? "Low Attendance Alert"
                    : "Daily Attendance",
                start: dateKey,
                allDay: true,
                backgroundColor,
                borderColor: backgroundColor,
                extendedProps: {
                    type: "attendance",
                    present: stats.present,
                    absent: stats.absent,
                    onLeave: stats.onLeave,
                    halfDay: stats.halfDay,
                    total,
                    attendancePercentage,
                    category: "attendance",
                },
            });
        });
        return events;
    }
    /**
     * Get approved leave events (filtered by permissions)
     */
    async getLeaveEvents(workspaceId, userId, startDate, endDate, canManageAll, teamMemberIds) {
        const leaveConditions = [
            (0, drizzle_orm_1.eq)(schema_1.leaves.workspaceId, workspaceId),
            (0, drizzle_orm_1.eq)(schema_1.leaves.status, "APPROVED"),
            (0, drizzle_orm_1.gte)(schema_1.leaves.endDate, startDate),
            (0, drizzle_orm_1.lte)(schema_1.leaves.startDate, endDate),
        ];
        // Filter leaves by user visibility
        if (!canManageAll) {
            if (teamMemberIds.length > 0) {
                // Include team members + self
                const visibleUserIds = [...teamMemberIds, userId];
                leaveConditions.push((0, drizzle_orm_1.inArray)(schema_1.leaves.userId, visibleUserIds));
            }
            else {
                // Only own leaves
                leaveConditions.push((0, drizzle_orm_1.eq)(schema_1.leaves.userId, userId));
            }
        }
        // FIXED: Join with leaveTypes to get dynamic leave type name and color
        const approvedLeaves = await drizzle_1.db
            .select({
            id: schema_1.leaves.id,
            userId: schema_1.leaves.userId,
            startDate: schema_1.leaves.startDate,
            endDate: schema_1.leaves.endDate,
            leaveTypeId: schema_1.leaves.leaveTypeId, // FIXED: Changed from type
            leaveTypeName: schema_1.leaveTypes.name, // FIXED: Get name from leaveTypes
            leaveTypeColor: schema_1.leaveTypes.color, // FIXED: Get color from leaveTypes
            reason: schema_1.leaves.reason,
            userName: schema_1.users.name,
            teamName: schema_1.teams.name,
        })
            .from(schema_1.leaves)
            .leftJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.leaves.userId, schema_1.users.id))
            .leftJoin(schema_1.workspaceMembers, (0, drizzle_orm_1.eq)(schema_1.users.id, schema_1.workspaceMembers.userId))
            .leftJoin(schema_1.teams, (0, drizzle_orm_1.eq)(schema_1.workspaceMembers.teamId, schema_1.teams.id))
            .leftJoin(schema_1.leaveTypes, (0, drizzle_orm_1.eq)(schema_1.leaves.leaveTypeId, schema_1.leaveTypes.id)) // FIXED: Join with leaveTypes
            .where((0, drizzle_orm_1.and)(...leaveConditions));
        return approvedLeaves.map((leave) => {
            const leaveTypeName = leave.leaveTypeName || "Leave";
            const leaveColor = leave.leaveTypeColor || "#3b82f6";
            return {
                id: `leave-${leave.id}`,
                title: `${leave.userName} - ${leaveTypeName}`, // FIXED: Use dynamic name
                start: new Date(leave.startDate).toISOString().split("T")[0],
                end: new Date(new Date(leave.endDate).setDate(new Date(leave.endDate).getDate() + 1))
                    .toISOString()
                    .split("T")[0],
                backgroundColor: leaveColor, // FIXED: Use color from DB
                borderColor: leaveColor, // FIXED: Use color from DB
                extendedProps: {
                    type: "leave",
                    employee: leave.userName,
                    department: leave.teamName || "N/A",
                    leaveType: leaveTypeName, // FIXED: Use dynamic name
                    leaveTypeId: leave.leaveTypeId,
                    reason: leave.reason,
                    category: "leave",
                },
            };
        });
    }
    /**
     * Get holiday events
     */
    async getHolidayEvents(month, year) {
        const holidays = {
            "2026-01-26": "Republic Day",
            "2026-04-03": "Good Friday",
            "2026-04-14": "Ambedkar Jayanti",
            "2026-05-01": "Labour Day",
            "2026-08-15": "Independence Day",
            "2026-10-02": "Gandhi Jayanti",
            "2026-12-25": "Christmas",
        };
        const events = [];
        Object.entries(holidays).forEach(([date, name]) => {
            const holidayDate = new Date(date);
            if (holidayDate.getMonth() + 1 === month &&
                holidayDate.getFullYear() === year) {
                events.push({
                    id: `holiday-${date}`,
                    title: `${name} - Company Holiday`,
                    start: date,
                    allDay: true,
                    backgroundColor: "#eab308",
                    borderColor: "#eab308",
                    extendedProps: {
                        type: "holiday",
                        category: "holiday",
                    },
                });
            }
        });
        return events;
    }
}
exports.HRCalendarService = HRCalendarService;
