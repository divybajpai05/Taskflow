"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaveTypesService = void 0;
// src/modules/leave-types/leave-types.service.ts
const drizzle_1 = require("../../db/drizzle");
const schema_1 = require("../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const uuid_1 = require("uuid");
class LeaveTypesService {
    async getAll(workspaceId) {
        return await drizzle_1.db
            .select()
            .from(schema_1.leaveTypes)
            .where((0, drizzle_orm_1.eq)(schema_1.leaveTypes.workspaceId, workspaceId))
            .orderBy(schema_1.leaveTypes.name);
    }
    async getActive(workspaceId) {
        return await drizzle_1.db
            .select()
            .from(schema_1.leaveTypes)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.leaveTypes.workspaceId, workspaceId), (0, drizzle_orm_1.eq)(schema_1.leaveTypes.isActive, true)))
            .orderBy(schema_1.leaveTypes.name);
    }
    async getById(workspaceId, id) {
        const [leaveType] = await drizzle_1.db
            .select()
            .from(schema_1.leaveTypes)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.leaveTypes.id, id), (0, drizzle_orm_1.eq)(schema_1.leaveTypes.workspaceId, workspaceId)));
        return leaveType;
    }
    async create(workspaceId, input) {
        // Check for duplicate name
        const [existing] = await drizzle_1.db
            .select({ id: schema_1.leaveTypes.id })
            .from(schema_1.leaveTypes)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.leaveTypes.workspaceId, workspaceId), (0, drizzle_orm_1.eq)(schema_1.leaveTypes.name, input.name)));
        if (existing) {
            throw new Error("Leave type with this name already exists");
        }
        const id = (0, uuid_1.v4)();
        await drizzle_1.db.insert(schema_1.leaveTypes).values({
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
        const [created] = await drizzle_1.db
            .select()
            .from(schema_1.leaveTypes)
            .where((0, drizzle_orm_1.eq)(schema_1.leaveTypes.id, id));
        return created;
    }
    async update(workspaceId, id, input) {
        // Check if leave type exists
        const [existing] = await drizzle_1.db
            .select()
            .from(schema_1.leaveTypes)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.leaveTypes.id, id), (0, drizzle_orm_1.eq)(schema_1.leaveTypes.workspaceId, workspaceId)));
        if (!existing)
            return null;
        // Check for duplicate name if name is being changed
        if (input.name && input.name !== existing.name) {
            const [duplicate] = await drizzle_1.db
                .select({ id: schema_1.leaveTypes.id })
                .from(schema_1.leaveTypes)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.leaveTypes.workspaceId, workspaceId), (0, drizzle_orm_1.eq)(schema_1.leaveTypes.name, input.name)));
            if (duplicate && duplicate.id !== id) {
                throw new Error("Leave type with this name already exists");
            }
        }
        const updateData = {};
        if (input.name !== undefined)
            updateData.name = input.name;
        if (input.description !== undefined)
            updateData.description = input.description;
        if (input.color !== undefined)
            updateData.color = input.color;
        if (input.isPaid !== undefined)
            updateData.isPaid = input.isPaid;
        if (input.defaultDays !== undefined)
            updateData.defaultDays = input.defaultDays;
        if (input.requiresApproval !== undefined)
            updateData.requiresApproval = input.requiresApproval;
        if (input.isActive !== undefined)
            updateData.isActive = input.isActive;
        await drizzle_1.db
            .update(schema_1.leaveTypes)
            .set(updateData)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.leaveTypes.id, id), (0, drizzle_orm_1.eq)(schema_1.leaveTypes.workspaceId, workspaceId)));
        const [updated] = await drizzle_1.db
            .select()
            .from(schema_1.leaveTypes)
            .where((0, drizzle_orm_1.eq)(schema_1.leaveTypes.id, id));
        return updated;
    }
    async delete(workspaceId, id) {
        const [existing] = await drizzle_1.db
            .select({ id: schema_1.leaveTypes.id })
            .from(schema_1.leaveTypes)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.leaveTypes.id, id), (0, drizzle_orm_1.eq)(schema_1.leaveTypes.workspaceId, workspaceId)));
        if (!existing)
            return false;
        await drizzle_1.db
            .delete(schema_1.leaveTypes)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.leaveTypes.id, id), (0, drizzle_orm_1.eq)(schema_1.leaveTypes.workspaceId, workspaceId)));
        return true;
    }
}
exports.LeaveTypesService = LeaveTypesService;
