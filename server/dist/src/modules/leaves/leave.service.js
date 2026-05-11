"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaveService = void 0;
// src/modules/leaves/leave.service.ts
const drizzle_1 = require("../../db/drizzle");
const schema_1 = require("../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const uuid_1 = require("uuid");
class LeaveService {
    /**
     * Get all leave requests in a workspace
     */
    async getLeaves(workspaceId, filters) {
        const conditions = [(0, drizzle_orm_1.eq)(schema_1.leaves.workspaceId, workspaceId)];
        if (filters?.status && filters.status !== "All") {
            conditions.push((0, drizzle_orm_1.eq)(schema_1.leaves.status, filters.status.toUpperCase()));
        }
        if (filters?.leaveType && filters.leaveType !== "All") {
            conditions.push((0, drizzle_orm_1.eq)(schema_1.leaves.type, filters.leaveType.toUpperCase().replace(" ", "_")));
        }
        const leaveList = await drizzle_1.db
            .select({
            id: schema_1.leaves.id,
            userId: schema_1.leaves.userId,
            employeeName: schema_1.users.name,
            employeeEmail: schema_1.users.email,
            employeeAvatar: schema_1.users.avatar,
            department: schema_1.users.team,
            leaveType: schema_1.leaves.type,
            startDate: schema_1.leaves.startDate,
            endDate: schema_1.leaves.endDate,
            reason: schema_1.leaves.reason,
            status: schema_1.leaves.status,
            approvedById: schema_1.leaves.approvedById,
            approverName: schema_1.users.name,
            createdAt: schema_1.leaves.startDate,
        })
            .from(schema_1.leaves)
            .innerJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.leaves.userId, schema_1.users.id))
            .where((0, drizzle_orm_1.and)(...conditions))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.leaves.startDate));
        // Apply search filter in memory
        let filtered = leaveList;
        if (filters?.search) {
            const search = filters.search.toLowerCase();
            filtered = leaveList.filter((l) => l.employeeName?.toLowerCase().includes(search) ||
                l.reason?.toLowerCase().includes(search));
        }
        // Apply department filter in memory
        if (filters?.department && filters.department !== "All") {
            filtered = filtered.filter((l) => l.department === filters.department);
        }
        return filtered.map((l) => ({
            id: l.id,
            employee: l.employeeName || "Unknown",
            email: l.employeeEmail || "",
            avatar: l.employeeAvatar || null,
            initials: (l.employeeName || "U")
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2),
            department: l.department || "N/A",
            leaveType: l.leaveType?.replace("_", " ") || "N/A",
            fromDate: l.startDate
                ? new Date(l.startDate).toISOString().split("T")[0]
                : "",
            toDate: l.endDate ? new Date(l.endDate).toISOString().split("T")[0] : "",
            days: l.startDate && l.endDate
                ? Math.ceil((new Date(l.endDate).getTime() -
                    new Date(l.startDate).getTime()) /
                    (1000 * 60 * 60 * 24)) + 1
                : 0,
            reason: l.reason || "",
            status: l.status
                ? l.status.charAt(0).toUpperCase() + l.status.slice(1).toLowerCase()
                : "Pending",
            leaveTypeOriginal: l.leaveType,
            statusOriginal: l.status,
        }));
    }
    /**
     * Get leave stats for a workspace
     */
    async getLeaveStats(workspaceId) {
        const allLeaves = await drizzle_1.db
            .select({ status: schema_1.leaves.status })
            .from(schema_1.leaves)
            .where((0, drizzle_orm_1.eq)(schema_1.leaves.workspaceId, workspaceId));
        return {
            total: allLeaves.length,
            pending: allLeaves.filter((l) => l.status === "PENDING").length,
            approved: allLeaves.filter((l) => l.status === "APPROVED").length,
            rejected: allLeaves.filter((l) => l.status === "REJECTED").length,
        };
    }
    /**
     * Create a new leave request
     */
    async createLeave(input, workspaceId) {
        const { userId, leaveType, startDate, endDate, reason } = input;
        const leaveId = (0, uuid_1.v4)();
        await drizzle_1.db.insert(schema_1.leaves).values({
            id: leaveId,
            userId,
            workspaceId,
            type: leaveType.toUpperCase().replace(" ", "_"),
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            reason,
            status: "PENDING",
        });
        return { success: true, message: "Leave request submitted", leaveId };
    }
    /**
     * Delete a leave request
     */
    async deleteLeave(leaveId) {
        await drizzle_1.db.delete(schema_1.leaves).where((0, drizzle_orm_1.eq)(schema_1.leaves.id, leaveId));
        return { success: true, message: "Leave request deleted" };
    }
    /**
     * Update leave status and sync with attendance
     */
    async updateLeaveStatus(leaveId, input) {
        const { status, approvedById } = input;
        const [leave] = await drizzle_1.db
            .select()
            .from(schema_1.leaves)
            .where((0, drizzle_orm_1.eq)(schema_1.leaves.id, leaveId))
            .limit(1);
        if (!leave)
            throw new Error("Leave request not found");
        const dbStatus = status.toUpperCase();
        // Update leave status
        await drizzle_1.db
            .update(schema_1.leaves)
            .set({ status: dbStatus, approvedById })
            .where((0, drizzle_orm_1.eq)(schema_1.leaves.id, leaveId));
        // ✅ If approved, mark attendance as "ON_LEAVE" for all dates in range
        if (dbStatus === "APPROVED") {
            const startDate = new Date(leave.startDate);
            const endDate = new Date(leave.endDate);
            // Loop through each day in the leave range
            for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                const dateStr = d.toISOString().split("T")[0];
                // Check if attendance already exists for this user on this date
                const [existingAttendance] = await drizzle_1.db
                    .select()
                    .from(schema_1.attendance)
                    .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.attendance.userId, leave.userId), (0, drizzle_orm_1.eq)(schema_1.attendance.workspaceId, leave.workspaceId), (0, drizzle_orm_1.gte)(schema_1.attendance.date, new Date(dateStr + "T00:00:00")), (0, drizzle_orm_1.lte)(schema_1.attendance.date, new Date(dateStr + "T23:59:59"))))
                    .limit(1);
                if (existingAttendance) {
                    // Update existing attendance
                    await drizzle_1.db
                        .update(schema_1.attendance)
                        .set({ status: "ON_LEAVE", markedById: approvedById })
                        .where((0, drizzle_orm_1.eq)(schema_1.attendance.id, existingAttendance.id));
                }
                else {
                    // Create new attendance record
                    await drizzle_1.db.insert(schema_1.attendance).values({
                        id: (0, uuid_1.v4)(),
                        userId: leave.userId,
                        workspaceId: leave.workspaceId,
                        date: new Date(dateStr + "T09:00:00"),
                        status: "ON_LEAVE",
                        markedById: approvedById,
                    });
                }
            }
            console.log(`✅ Attendance synced for leave ${leaveId}: ${leave.type} from ${startDate.toDateString()} to ${endDate.toDateString()}`);
        }
        // ✅ If rejected, remove any "ON_LEAVE" attendance for these dates
        if (dbStatus === "REJECTED") {
            const startDate = new Date(leave.startDate);
            const endDate = new Date(leave.endDate);
            for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                const dateStr = d.toISOString().split("T")[0];
                await drizzle_1.db
                    .delete(schema_1.attendance)
                    .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.attendance.userId, leave.userId), (0, drizzle_orm_1.eq)(schema_1.attendance.workspaceId, leave.workspaceId), (0, drizzle_orm_1.eq)(schema_1.attendance.status, "ON_LEAVE"), (0, drizzle_orm_1.gte)(schema_1.attendance.date, new Date(dateStr + "T00:00:00")), (0, drizzle_orm_1.lte)(schema_1.attendance.date, new Date(dateStr + "T23:59:59"))));
            }
            console.log(`✅ ON_LEAVE attendance removed for rejected leave ${leaveId}`);
        }
        return {
            success: true,
            message: `Leave ${dbStatus.toLowerCase()}`,
            status: dbStatus,
        };
    }
}
exports.LeaveService = LeaveService;
