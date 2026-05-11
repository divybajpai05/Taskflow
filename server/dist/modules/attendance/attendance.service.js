"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceService = void 0;
// src/modules/attendance/attendance.service.ts
const drizzle_1 = require("../../db/drizzle");
const schema_1 = require("../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
class AttendanceService {
    /**
     * Get attendance for a specific date
     */
    async getAttendanceByDate(workspaceId, date) {
        const targetDate = new Date(date);
        const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
        // FIXED: Get team from teams table via workspaceMembers
        const workspaceUsers = await drizzle_1.db
            .select({
            id: schema_1.users.id,
            name: schema_1.users.name,
            email: schema_1.users.email,
            avatar: schema_1.users.avatar,
            team: schema_1.teams.name, // FIXED: Get team name from teams table
            role: schema_1.roles.name,
        })
            .from(schema_1.users)
            .innerJoin(schema_1.workspaceMembers, (0, drizzle_orm_1.eq)(schema_1.users.id, schema_1.workspaceMembers.userId))
            .innerJoin(schema_1.roles, (0, drizzle_orm_1.eq)(schema_1.workspaceMembers.roleId, schema_1.roles.id))
            .leftJoin(schema_1.teams, (0, drizzle_orm_1.eq)(schema_1.workspaceMembers.teamId, schema_1.teams.id)) // FIXED: Join with teams
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.workspaceMembers.workspaceId, workspaceId), (0, drizzle_orm_1.eq)(schema_1.users.isActive, true)));
        // Get attendance records for this date
        const attendanceRecords = await drizzle_1.db
            .select()
            .from(schema_1.attendance)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.attendance.workspaceId, workspaceId), (0, drizzle_orm_1.gte)(schema_1.attendance.date, startOfDay), (0, drizzle_orm_1.lte)(schema_1.attendance.date, endOfDay)));
        // Merge users with their attendance
        const attendanceSheet = workspaceUsers.map((user) => {
            const record = attendanceRecords.find((a) => a.userId === user.id);
            return {
                id: user.id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                initials: user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2),
                team: user.team || "N/A",
                department: user.team || "N/A",
                role: user.role,
                status: record?.status || null,
                checkInTime: record?.date
                    ? new Date(record.date).toLocaleTimeString()
                    : "-",
                notes: record?.notes || null,
                attendanceId: record?.id || null,
            };
        });
        return attendanceSheet;
    }
    /**
     * Mark or update attendance for a user
     */
    async markAttendance(workspaceId, userId, date, status, markedById, notes) {
        const targetDate = new Date(date);
        targetDate.setHours(9, 0, 0, 0);
        const [existingRecord] = await drizzle_1.db
            .select()
            .from(schema_1.attendance)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.attendance.userId, userId), (0, drizzle_orm_1.eq)(schema_1.attendance.workspaceId, workspaceId), (0, drizzle_orm_1.gte)(schema_1.attendance.date, new Date(date + "T00:00:00")), (0, drizzle_orm_1.lte)(schema_1.attendance.date, new Date(date + "T23:59:59"))))
            .limit(1);
        if (existingRecord) {
            await drizzle_1.db
                .update(schema_1.attendance)
                .set({
                status: status,
                markedById,
                notes: notes || null,
            })
                .where((0, drizzle_orm_1.eq)(schema_1.attendance.id, existingRecord.id));
            return { ...existingRecord, status, markedById, notes };
        }
        else {
            const newRecord = {
                userId,
                workspaceId,
                date: targetDate,
                status: status,
                markedById,
                notes: notes || null,
            };
            await drizzle_1.db.insert(schema_1.attendance).values({
                id: crypto.randomUUID(),
                ...newRecord,
            });
            return newRecord;
        }
    }
    /**
     * Bulk mark attendance for multiple users
     */
    async bulkMarkAttendance(workspaceId, date, status, userIds, markedById) {
        const results = [];
        for (const userId of userIds) {
            const result = await this.markAttendance(workspaceId, userId, date, status, markedById);
            results.push(result);
        }
        return { success: true, count: results.length };
    }
    /**
     * Get attendance stats for a date
     */
    async getAttendanceStats(workspaceId, date) {
        const attendanceSheet = await this.getAttendanceByDate(workspaceId, date);
        const total = attendanceSheet.length;
        const present = attendanceSheet.filter((a) => a.status === "PRESENT").length;
        const absent = attendanceSheet.filter((a) => a.status === "ABSENT").length;
        const late = attendanceSheet.filter((a) => a.status === "LATE").length;
        const halfDay = attendanceSheet.filter((a) => a.status === "HALF_DAY").length;
        const onLeave = attendanceSheet.filter((a) => a.status === "ON_LEAVE").length;
        const notMarked = attendanceSheet.filter((a) => !a.status).length;
        return {
            total,
            present,
            absent,
            late,
            halfDay,
            onLeave,
            notMarked,
            presentPercentage: total > 0 ? Math.round((present / total) * 100) : 0,
            absentPercentage: total > 0 ? Math.round((absent / total) * 100) : 0,
        };
    }
    /**
     * Get monthly attendance stats
     */
    async getMonthlyStats(workspaceId, month, year) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        const records = await drizzle_1.db
            .select()
            .from(schema_1.attendance)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.attendance.workspaceId, workspaceId), (0, drizzle_orm_1.gte)(schema_1.attendance.date, startDate), (0, drizzle_orm_1.lte)(schema_1.attendance.date, endDate)));
        const totalDays = records.length > 0
            ? new Set(records.map((r) => new Date(r.date).toDateString())).size
            : 0;
        const presentCount = records.filter((r) => r.status === "PRESENT").length;
        const totalRecords = records.length;
        return {
            totalWorkingDays: totalDays,
            totalAttendanceRecords: totalRecords,
            averageAttendance: totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0,
        };
    }
    /**
     * Get attendance for calendar view - for any month
     */
    async getCalendarMonthly(workspaceId, userId, userPermissions, userTeamId, month, year) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);
        const conditions = [
            (0, drizzle_orm_1.eq)(schema_1.attendance.workspaceId, workspaceId),
            (0, drizzle_orm_1.gte)(schema_1.attendance.date, startDate),
            (0, drizzle_orm_1.lte)(schema_1.attendance.date, endDate),
            (0, drizzle_orm_1.eq)(schema_1.attendance.userId, userId),
        ];
        const records = await drizzle_1.db
            .select({ date: schema_1.attendance.date, status: schema_1.attendance.status })
            .from(schema_1.attendance)
            .where((0, drizzle_orm_1.and)(...conditions));
        return records;
    }
}
exports.AttendanceService = AttendanceService;
