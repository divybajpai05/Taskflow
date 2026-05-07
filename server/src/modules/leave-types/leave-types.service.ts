// src/modules/leave-types/leave-types.service.ts
import { db } from "../../db/drizzle";
import { leaveTypes } from "../../db/schema";
import { eq, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

interface CreateLeaveTypeInput {
  name: string;
  description?: string | null;
  color: string;
  isPaid: boolean;
  defaultDays: number;
  requiresApproval: boolean;
}

interface UpdateLeaveTypeInput {
  name?: string;
  description?: string | null;
  color?: string;
  isPaid?: boolean;
  defaultDays?: number;
  requiresApproval?: boolean;
  isActive?: boolean;
}

export class LeaveTypesService {
  async getAll(workspaceId: string) {
    return await db
      .select()
      .from(leaveTypes)
      .where(eq(leaveTypes.workspaceId, workspaceId))
      .orderBy(leaveTypes.name);
  }

  async getActive(workspaceId: string) {
    return await db
      .select()
      .from(leaveTypes)
      .where(
        and(
          eq(leaveTypes.workspaceId, workspaceId),
          eq(leaveTypes.isActive, true),
        ),
      )
      .orderBy(leaveTypes.name);
  }

  async getById(workspaceId: string, id: string) {
    const [leaveType] = await db
      .select()
      .from(leaveTypes)
      .where(
        and(eq(leaveTypes.id, id), eq(leaveTypes.workspaceId, workspaceId)),
      );
    return leaveType;
  }

  async create(workspaceId: string, input: CreateLeaveTypeInput) {
    // Check for duplicate name
    const [existing] = await db
      .select({ id: leaveTypes.id })
      .from(leaveTypes)
      .where(
        and(
          eq(leaveTypes.workspaceId, workspaceId),
          eq(leaveTypes.name, input.name),
        ),
      );

    if (existing) {
      throw new Error("Leave type with this name already exists");
    }

    const id = uuidv4();
    await db.insert(leaveTypes).values({
      id,
      workspaceId,
      name: input.name,
      description: input.description,
      color: input.color,
      isPaid: input.isPaid,
      defaultDays: input.defaultDays,
      requiresApproval: input.requiresApproval,
      isActive: true,
    });

    const [created] = await db
      .select()
      .from(leaveTypes)
      .where(eq(leaveTypes.id, id));

    return created;
  }

  async update(workspaceId: string, id: string, input: UpdateLeaveTypeInput) {
    // Check if leave type exists
    const [existing] = await db
      .select()
      .from(leaveTypes)
      .where(
        and(eq(leaveTypes.id, id), eq(leaveTypes.workspaceId, workspaceId)),
      );

    if (!existing) return null;

    // Check for duplicate name if name is being changed
    if (input.name && input.name !== existing.name) {
      const [duplicate] = await db
        .select({ id: leaveTypes.id })
        .from(leaveTypes)
        .where(
          and(
            eq(leaveTypes.workspaceId, workspaceId),
            eq(leaveTypes.name, input.name),
            // Exclude current record
          ),
        );

      if (duplicate && duplicate.id !== id) {
        throw new Error("Leave type with this name already exists");
      }
    }

    const updateData: any = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined)
      updateData.description = input.description;
    if (input.color !== undefined) updateData.color = input.color;
    if (input.isPaid !== undefined) updateData.isPaid = input.isPaid;
    if (input.defaultDays !== undefined)
      updateData.defaultDays = input.defaultDays;
    if (input.requiresApproval !== undefined)
      updateData.requiresApproval = input.requiresApproval;
    if (input.isActive !== undefined) updateData.isActive = input.isActive;

    await db
      .update(leaveTypes)
      .set(updateData)
      .where(
        and(eq(leaveTypes.id, id), eq(leaveTypes.workspaceId, workspaceId)),
      );

    const [updated] = await db
      .select()
      .from(leaveTypes)
      .where(eq(leaveTypes.id, id));

    return updated;
  }

  async delete(workspaceId: string, id: string) {
    const [existing] = await db
      .select({ id: leaveTypes.id })
      .from(leaveTypes)
      .where(
        and(eq(leaveTypes.id, id), eq(leaveTypes.workspaceId, workspaceId)),
      );

    if (!existing) return false;

    await db
      .delete(leaveTypes)
      .where(
        and(eq(leaveTypes.id, id), eq(leaveTypes.workspaceId, workspaceId)),
      );

    return true;
  }
}
