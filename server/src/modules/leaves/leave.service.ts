// src/modules/leaves/leave.service.ts
import { db } from "../../db/drizzle";
import { attendance, leaves, users, workspaceMembers } from "../../db/schema";
import { eq, and, gte, lte, like, or, desc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export interface CreateLeaveInput {
  userId: string;
  leaveType: string;
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

    if (filters?.leaveType && filters.leaveType !== "All") {
      conditions.push(
        eq(
          leaves.type,
          filters.leaveType.toUpperCase().replace(" ", "_") as
            | "CASUAL"
            | "SICK"
            | "EARNED"
            | "UNPAID",
        ),
      );
    }

    const leaveList = await db
      .select({
        id: leaves.id,
        userId: leaves.userId,
        employeeName: users.name,
        employeeEmail: users.email,
        employeeAvatar: users.avatar,
        department: users.team,
        leaveType: leaves.type,
        startDate: leaves.startDate,
        endDate: leaves.endDate,
        reason: leaves.reason,
        status: leaves.status,
        approvedById: leaves.approvedById,
        approverName: users.name,
        createdAt: leaves.startDate,
      })
      .from(leaves)
      .innerJoin(users, eq(leaves.userId, users.id))
      .where(and(...conditions))
      .orderBy(desc(leaves.startDate));

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
      leaveTypeOriginal: l.leaveType,
      statusOriginal: l.status,
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
    const { userId, leaveType, startDate, endDate, reason } = input;

    const leaveId = uuidv4();

    await db.insert(leaves).values({
      id: leaveId,
      userId,
      workspaceId,
      type: leaveType.toUpperCase().replace(" ", "_") as any,
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
  async deleteLeave(leaveId: string) {
    await db.delete(leaves).where(eq(leaves.id, leaveId));
    return { success: true, message: "Leave request deleted" };
  }

  /**
   * Update leave status and sync with attendance
   */
  async updateLeaveStatus(leaveId: string, input: UpdateLeaveStatusInput) {
    const { status, approvedById } = input;

    const [leave] = await db
      .select()
      .from(leaves)
      .where(eq(leaves.id, leaveId))
      .limit(1);

    if (!leave) throw new Error("Leave request not found");

    const dbStatus = status.toUpperCase() as "APPROVED" | "REJECTED";

    // Update leave status
    await db
      .update(leaves)
      .set({ status: dbStatus, approvedById })
      .where(eq(leaves.id, leaveId));

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

      console.log(
        `✅ Attendance synced for leave ${leaveId}: ${leave.type} from ${startDate.toDateString()} to ${endDate.toDateString()}`,
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
}
