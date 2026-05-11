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
        // FIXED: Filter by leave type name (join with leaveTypes)
        let leaveTypeFilter = null;
        if (filters?.leaveType && filters.leaveType !== "All") {
            leaveTypeFilter = filters.leaveType;
        }
        const leaveList = await drizzle_1.db
            .select({
            id: schema_1.leaves.id,
            userId: schema_1.leaves.userId,
            employeeName: schema_1.users.name,
            employeeEmail: schema_1.users.email,
            employeeAvatar: schema_1.users.avatar,
            department: schema_1.teams.name,
            leaveTypeId: schema_1.leaves.leaveTypeId,
            leaveTypeName: schema_1.leaveTypes.name, // FIXED: Get name from leaveTypes
            leaveTypeColor: schema_1.leaveTypes.color, // FIXED: Get color from leaveTypes
            startDate: schema_1.leaves.startDate,
            endDate: schema_1.leaves.endDate,
            reason: schema_1.leaves.reason,
            status: schema_1.leaves.status,
            approvedById: schema_1.leaves.approvedById,
            approverName: schema_1.users.name,
            createdAt: schema_1.leaves.createdAt,
        })
            .from(schema_1.leaves)
            .innerJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.leaves.userId, schema_1.users.id))
            .leftJoin(schema_1.leaveTypes, (0, drizzle_orm_1.eq)(schema_1.leaves.leaveTypeId, schema_1.leaveTypes.id)) // FIXED: Join with leaveTypes
            .leftJoin(schema_1.workspaceMembers, (0, drizzle_orm_1.eq)(schema_1.users.id, schema_1.workspaceMembers.userId))
            .leftJoin(schema_1.teams, (0, drizzle_orm_1.eq)(schema_1.workspaceMembers.teamId, schema_1.teams.id))
            .where((0, drizzle_orm_1.and)(...conditions))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.leaves.createdAt));
        // Apply search filter in memory
        let filtered = leaveList;
        if (filters?.search) {
            const search = filters.search.toLowerCase();
            filtered = leaveList.filter((l) => l.employeeName?.toLowerCase().includes(search) ||
                l.reason?.toLowerCase().includes(search));
        }
        // FIXED: Apply leave type filter in memory (by name)
        if (leaveTypeFilter) {
            filtered = filtered.filter((l) => l.leaveTypeName === leaveTypeFilter);
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
            leaveType: l.leaveTypeName || "N/A", // FIXED: Use name from leaveTypes
            leaveTypeId: l.leaveTypeId,
            leaveTypeColor: l.leaveTypeColor || "#94a3b8",
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
        const { userId, leaveTypeId, startDate, endDate, reason } = input;
        // FIXED: Validate leave type exists
        const [leaveTypeExists] = await drizzle_1.db
            .select({ id: schema_1.leaveTypes.id, name: schema_1.leaveTypes.name })
            .from(schema_1.leaveTypes)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.leaveTypes.id, leaveTypeId), (0, drizzle_orm_1.eq)(schema_1.leaveTypes.workspaceId, workspaceId), (0, drizzle_orm_1.eq)(schema_1.leaveTypes.isActive, true)));
        if (!leaveTypeExists) {
            throw new Error("Invalid or inactive leave type");
        }
        const leaveId = (0, uuid_1.v4)();
        // FIXED: Use leaveTypeId instead of type
        await drizzle_1.db.insert(schema_1.leaves).values({
            id: leaveId,
            userId,
            workspaceId,
            leaveTypeId, // FIXED: Changed from type to leaveTypeId
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            reason,
            status: "PENDING",
        });
        return {
            success: true,
            message: "Leave request submitted",
            leaveId,
            leaveTypeName: leaveTypeExists.name,
        };
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
        // FIXED: Get leave with leave type name
        const [leave] = await drizzle_1.db
            .select({
            id: schema_1.leaves.id,
            userId: schema_1.leaves.userId,
            workspaceId: schema_1.leaves.workspaceId,
            leaveTypeId: schema_1.leaves.leaveTypeId,
            leaveTypeName: schema_1.leaveTypes.name, // FIXED: Get name from join
            startDate: schema_1.leaves.startDate,
            endDate: schema_1.leaves.endDate,
            status: schema_1.leaves.status,
        })
            .from(schema_1.leaves)
            .leftJoin(schema_1.leaveTypes, (0, drizzle_orm_1.eq)(schema_1.leaves.leaveTypeId, schema_1.leaveTypes.id))
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
        const leaveTypeName = leave.leaveTypeName || "Unknown";
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
            // FIXED: Use leaveTypeName instead of leave.type
            console.log(`✅ Attendance synced for leave ${leaveId}: ${leaveTypeName} from ${new Date(leave.startDate).toDateString()} to ${new Date(leave.endDate).toDateString()}`);
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
    /**
     * Get available leave types for workspace
     */
    async getLeaveTypes(workspaceId) {
        return await drizzle_1.db
            .select()
            .from(schema_1.leaveTypes)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.leaveTypes.workspaceId, workspaceId), (0, drizzle_orm_1.eq)(schema_1.leaveTypes.isActive, true)))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.leaveTypes.name));
    }
    /**
     * Get leave balance for a user (by leave type)
     */
    async getLeaveBalance(workspaceId, userId) {
        // Get all active leave types
        const allLeaveTypes = await drizzle_1.db
            .select()
            .from(schema_1.leaveTypes)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.leaveTypes.workspaceId, workspaceId), (0, drizzle_orm_1.eq)(schema_1.leaveTypes.isActive, true)));
        // Get approved leaves for this user (current year)
        const currentYear = new Date().getFullYear();
        const yearStart = new Date(currentYear, 0, 1);
        const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59);
        const userLeaves = await drizzle_1.db
            .select({
            leaveTypeId: schema_1.leaves.leaveTypeId,
            startDate: schema_1.leaves.startDate,
            endDate: schema_1.leaves.endDate,
        })
            .from(schema_1.leaves)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.leaves.userId, userId), (0, drizzle_orm_1.eq)(schema_1.leaves.workspaceId, workspaceId), (0, drizzle_orm_1.eq)(schema_1.leaves.status, "APPROVED"), (0, drizzle_orm_1.gte)(schema_1.leaves.startDate, yearStart), (0, drizzle_orm_1.lte)(schema_1.leaves.endDate, yearEnd)));
        // Calculate used days per leave type
        const usedDaysMap = new Map();
        userLeaves.forEach((leave) => {
            const days = Math.ceil((new Date(leave.endDate).getTime() -
                new Date(leave.startDate).getTime()) /
                (1000 * 60 * 60 * 24)) + 1;
            const current = usedDaysMap.get(leave.leaveTypeId) || 0;
            usedDaysMap.set(leave.leaveTypeId, current + days);
        });
        // Build balance response
        const balance = allLeaveTypes.map((type) => {
            const used = usedDaysMap.get(type.id) || 0;
            const total = type.defaultDays;
            return {
                id: type.id,
                name: type.name,
                color: type.color,
                description: type.description,
                isPaid: type.isPaid,
                totalDays: total,
                usedDays: used,
                remainingDays: total > 0 ? Math.max(0, total - used) : Infinity,
                exhausted: total > 0 && used >= total,
            };
        });
        return balance;
    }
    /**
     * Get current user's leaves
     */
    async getMyLeaves(workspaceId, userId) {
        const userLeaves = await drizzle_1.db
            .select({
            id: schema_1.leaves.id,
            userId: schema_1.leaves.userId,
            employeeName: schema_1.users.name,
            employeeEmail: schema_1.users.email,
            leaveTypeId: schema_1.leaves.leaveTypeId,
            leaveTypeName: schema_1.leaveTypes.name,
            leaveTypeColor: schema_1.leaveTypes.color,
            startDate: schema_1.leaves.startDate,
            endDate: schema_1.leaves.endDate,
            reason: schema_1.leaves.reason,
            status: schema_1.leaves.status,
            approvedById: schema_1.leaves.approvedById,
            createdAt: schema_1.leaves.createdAt,
        })
            .from(schema_1.leaves)
            .innerJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.leaves.userId, schema_1.users.id))
            .leftJoin(schema_1.leaveTypes, (0, drizzle_orm_1.eq)(schema_1.leaves.leaveTypeId, schema_1.leaveTypes.id))
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.leaves.workspaceId, workspaceId), (0, drizzle_orm_1.eq)(schema_1.leaves.userId, userId)))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.leaves.createdAt));
        return userLeaves.map((l) => ({
            id: l.id,
            leaveType: l.leaveTypeName || "N/A",
            leaveTypeColor: l.leaveTypeColor || "#94a3b8",
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
            createdAt: l.createdAt,
        }));
    }
}
exports.LeaveService = LeaveService;
