// src/modules/leaves/leave.service.ts
import { db } from "../../db/drizzle";
import {
  attendance,
  leaves,
  users,
  workspaceMembers,
  leaveTypes,
  teams,
} from "../../db/schema";
import { eq, and, gte, lte, like, or, desc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export interface CreateLeaveInput {
  userId: string;
  leaveTypeId: string; // FIXED: Changed from leaveType to leaveTypeId
  startDate: string;
  endDate: string;
  reason: string;
}

export interface UpdateLeaveStatusInput {
  status: string;
  approvedById: string;
}

export class LeaveService {
  /**
   * Get all leave requests in a workspace
   */
  async getLeaves(
    workspaceId: string,
    filters?: {
      status?: string;
      leaveType?: string;
      department?: string;
      search?: string;
    },
  ) {
    const conditions = [eq(leaves.workspaceId, workspaceId)];

    if (filters?.status && filters.status !== "All") {
      conditions.push(
        eq(
          leaves.status,
          filters.status.toUpperCase() as "PENDING" | "APPROVED" | "REJECTED",
        ),
      );
    }

    // FIXED: Filter by leave type name (join with leaveTypes)
    let leaveTypeFilter: string | null = null;
    if (filters?.leaveType && filters.leaveType !== "All") {
      leaveTypeFilter = filters.leaveType;
    }

    const leaveList = await db
      .select({
        id: leaves.id,
        userId: leaves.userId,
        employeeName: users.name,
        employeeEmail: users.email,
        employeeAvatar: users.avatar,
        department: teams.name,
        leaveTypeId: leaves.leaveTypeId,
        leaveTypeName: leaveTypes.name, // FIXED: Get name from leaveTypes
        leaveTypeColor: leaveTypes.color, // FIXED: Get color from leaveTypes
        startDate: leaves.startDate,
        endDate: leaves.endDate,
        reason: leaves.reason,
        status: leaves.status,
        approvedById: leaves.approvedById,
        approverName: users.name,
        createdAt: leaves.createdAt,
      })
      .from(leaves)
      .innerJoin(users, eq(leaves.userId, users.id))
      .leftJoin(leaveTypes, eq(leaves.leaveTypeId, leaveTypes.id)) // FIXED: Join with leaveTypes
      .leftJoin(workspaceMembers, eq(users.id, workspaceMembers.userId))
      .leftJoin(teams, eq(workspaceMembers.teamId, teams.id))
      .where(and(...conditions))
      .orderBy(desc(leaves.createdAt));

    // Apply search filter in memory
    let filtered = leaveList;
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      filtered = leaveList.filter(
        (l) =>
          l.employeeName?.toLowerCase().includes(search) ||
          l.reason?.toLowerCase().includes(search),
      );
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
      days:
        l.startDate && l.endDate
          ? Math.ceil(
              (new Date(l.endDate).getTime() -
                new Date(l.startDate).getTime()) /
                (1000 * 60 * 60 * 24),
            ) + 1
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
  async getLeaveStats(workspaceId: string) {
    const allLeaves = await db
      .select({ status: leaves.status })
      .from(leaves)
      .where(eq(leaves.workspaceId, workspaceId));

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
  async createLeave(input: CreateLeaveInput, workspaceId: string) {
    const { userId, leaveTypeId, startDate, endDate, reason } = input;

    // FIXED: Validate leave type exists
    const [leaveTypeExists] = await db
      .select({ id: leaveTypes.id, name: leaveTypes.name })
      .from(leaveTypes)
      .where(
        and(
          eq(leaveTypes.id, leaveTypeId),
          eq(leaveTypes.workspaceId, workspaceId),
          eq(leaveTypes.isActive, true),
        ),
      );

    if (!leaveTypeExists) {
      throw new Error("Invalid or inactive leave type");
    }

    const leaveId = uuidv4();

    // FIXED: Use leaveTypeId instead of type
    await db.insert(leaves).values({
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
  async deleteLeave(leaveId: string) {
    await db.delete(leaves).where(eq(leaves.id, leaveId));
    return { success: true, message: "Leave request deleted" };
  }

  /**
   * Update leave status and sync with attendance
   */
  async updateLeaveStatus(leaveId: string, input: UpdateLeaveStatusInput) {
    const { status, approvedById } = input;

    // FIXED: Get leave with leave type name
    const [leave] = await db
      .select({
        id: leaves.id,
        userId: leaves.userId,
        workspaceId: leaves.workspaceId,
        leaveTypeId: leaves.leaveTypeId,
        leaveTypeName: leaveTypes.name, // FIXED: Get name from join
        startDate: leaves.startDate,
        endDate: leaves.endDate,
        status: leaves.status,
      })
      .from(leaves)
      .leftJoin(leaveTypes, eq(leaves.leaveTypeId, leaveTypes.id))
      .where(eq(leaves.id, leaveId))
      .limit(1);

    if (!leave) throw new Error("Leave request not found");

    const dbStatus = status.toUpperCase() as "APPROVED" | "REJECTED";

    // Update leave status
    await db
      .update(leaves)
      .set({ status: dbStatus, approvedById })
      .where(eq(leaves.id, leaveId));

    const leaveTypeName = leave.leaveTypeName || "Unknown";

    // ✅ If approved, mark attendance as "ON_LEAVE" for all dates in range
    if (dbStatus === "APPROVED") {
      const startDate = new Date(leave.startDate);
      const endDate = new Date(leave.endDate);

      // Loop through each day in the leave range
      for (
        let d = new Date(startDate);
        d <= endDate;
        d.setDate(d.getDate() + 1)
      ) {
        const dateStr = d.toISOString().split("T")[0];

        // Check if attendance already exists for this user on this date
        const [existingAttendance] = await db
          .select()
          .from(attendance)
          .where(
            and(
              eq(attendance.userId, leave.userId),
              eq(attendance.workspaceId, leave.workspaceId),
              gte(attendance.date, new Date(dateStr + "T00:00:00")),
              lte(attendance.date, new Date(dateStr + "T23:59:59")),
            ),
          )
          .limit(1);

        if (existingAttendance) {
          // Update existing attendance
          await db
            .update(attendance)
            .set({ status: "ON_LEAVE", markedById: approvedById })
            .where(eq(attendance.id, existingAttendance.id));
        } else {
          // Create new attendance record
          await db.insert(attendance).values({
            id: uuidv4(),
            userId: leave.userId,
            workspaceId: leave.workspaceId,
            date: new Date(dateStr + "T09:00:00"),
            status: "ON_LEAVE",
            markedById: approvedById,
          });
        }
      }

      // FIXED: Use leaveTypeName instead of leave.type
      console.log(
        `✅ Attendance synced for leave ${leaveId}: ${leaveTypeName} from ${new Date(leave.startDate).toDateString()} to ${new Date(leave.endDate).toDateString()}`,
      );
    }

    // ✅ If rejected, remove any "ON_LEAVE" attendance for these dates
    if (dbStatus === "REJECTED") {
      const startDate = new Date(leave.startDate);
      const endDate = new Date(leave.endDate);

      for (
        let d = new Date(startDate);
        d <= endDate;
        d.setDate(d.getDate() + 1)
      ) {
        const dateStr = d.toISOString().split("T")[0];

        await db
          .delete(attendance)
          .where(
            and(
              eq(attendance.userId, leave.userId),
              eq(attendance.workspaceId, leave.workspaceId),
              eq(attendance.status, "ON_LEAVE"),
              gte(attendance.date, new Date(dateStr + "T00:00:00")),
              lte(attendance.date, new Date(dateStr + "T23:59:59")),
            ),
          );
      }

      console.log(
        `✅ ON_LEAVE attendance removed for rejected leave ${leaveId}`,
      );
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
  async getLeaveTypes(workspaceId: string) {
    return await db
      .select()
      .from(leaveTypes)
      .where(
        and(
          eq(leaveTypes.workspaceId, workspaceId),
          eq(leaveTypes.isActive, true),
        ),
      )
      .orderBy(desc(leaveTypes.name));
  }


  /**
   * Get leave balance for a user (by leave type)
   */
  async getLeaveBalance(workspaceId: string, userId: string) {
    // Get all active leave types
    const allLeaveTypes = await db
      .select()
      .from(leaveTypes)
      .where(
        and(
          eq(leaveTypes.workspaceId, workspaceId),
          eq(leaveTypes.isActive, true),
        ),
      );

    // Get approved leaves for this user (current year)
    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1);
    const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59);

    const userLeaves = await db
      .select({
        leaveTypeId: leaves.leaveTypeId,
        startDate: leaves.startDate,
        endDate: leaves.endDate,
      })
      .from(leaves)
      .where(
        and(
          eq(leaves.userId, userId),
          eq(leaves.workspaceId, workspaceId),
          eq(leaves.status, "APPROVED"),
          gte(leaves.startDate, yearStart),
          lte(leaves.endDate, yearEnd),
        ),
      );

    // Calculate used days per leave type
    const usedDaysMap = new Map<string, number>();
    userLeaves.forEach((leave) => {
      const days =
        Math.ceil(
          (new Date(leave.endDate).getTime() -
            new Date(leave.startDate).getTime()) /
            (1000 * 60 * 60 * 24),
        ) + 1;
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
  async getMyLeaves(workspaceId: string, userId: string) {
    const userLeaves = await db
      .select({
        id: leaves.id,
        userId: leaves.userId,
        employeeName: users.name,
        employeeEmail: users.email,
        leaveTypeId: leaves.leaveTypeId,
        leaveTypeName: leaveTypes.name,
        leaveTypeColor: leaveTypes.color,
        startDate: leaves.startDate,
        endDate: leaves.endDate,
        reason: leaves.reason,
        status: leaves.status,
        approvedById: leaves.approvedById,
        createdAt: leaves.createdAt,
      })
      .from(leaves)
      .innerJoin(users, eq(leaves.userId, users.id))
      .leftJoin(leaveTypes, eq(leaves.leaveTypeId, leaveTypes.id))
      .where(
        and(eq(leaves.workspaceId, workspaceId), eq(leaves.userId, userId)),
      )
      .orderBy(desc(leaves.createdAt));

    return userLeaves.map((l) => ({
      id: l.id,
      leaveType: l.leaveTypeName || "N/A",
      leaveTypeColor: l.leaveTypeColor || "#94a3b8",
      fromDate: l.startDate
        ? new Date(l.startDate).toISOString().split("T")[0]
        : "",
      toDate: l.endDate ? new Date(l.endDate).toISOString().split("T")[0] : "",
      days:
        l.startDate && l.endDate
          ? Math.ceil(
              (new Date(l.endDate).getTime() -
                new Date(l.startDate).getTime()) /
                (1000 * 60 * 60 * 24),
            ) + 1
          : 0,
      reason: l.reason || "",
      status: l.status
        ? l.status.charAt(0).toUpperCase() + l.status.slice(1).toLowerCase()
        : "Pending",
      createdAt: l.createdAt,
    }));
  }
}
