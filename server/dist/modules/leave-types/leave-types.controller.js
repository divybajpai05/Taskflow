"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaveTypesController = void 0;
const leave_types_service_1 = require("./leave-types.service");
const leaveTypesService = new leave_types_service_1.LeaveTypesService();
class LeaveTypesController {
    // Get all leave types for workspace
    async getAll(req, res, next) {
        try {
            const workspaceId = req.user.workspaceId;
            const leaveTypes = await leaveTypesService.getAll(workspaceId);
            res.json({ success: true, data: leaveTypes });
        }
        catch (error) {
            next(error);
        }
    }
    // Get active leave types (for dropdowns)
    async getActive(req, res, next) {
        try {
            const workspaceId = req.user.workspaceId;
            const leaveTypes = await leaveTypesService.getActive(workspaceId);
            res.json({ success: true, data: leaveTypes });
        }
        catch (error) {
            next(error);
        }
    }
    // Get single leave type
    async getById(req, res, next) {
        try {
            const workspaceId = req.user.workspaceId;
            const id = req.params.id; // FIXED: Cast to string
            const leaveType = await leaveTypesService.getById(workspaceId, id);
            if (!leaveType) {
                return res
                    .status(404)
                    .json({ success: false, error: "Leave type not found" });
            }
            res.json({ success: true, data: leaveType });
        }
        catch (error) {
            next(error);
        }
    }
    // Create leave type
    async create(req, res, next) {
        try {
            const workspaceId = req.user.workspaceId;
            const { name, description, color, isPaid, defaultDays, requiresApproval, } = req.body;
            // Validate required fields
            if (!name || !name.trim()) {
                return res
                    .status(400)
                    .json({ success: false, error: "Name is required" });
            }
            const leaveType = await leaveTypesService.create(workspaceId, {
                name: name.trim(),
                description: description?.trim() || null,
                color: color || "#3b82f6",
                isPaid: isPaid ?? true,
                defaultDays: defaultDays || 0,
                requiresApproval: requiresApproval ?? true,
            });
            res.status(201).json({ success: true, data: leaveType });
        }
        catch (error) {
            if (error.message === "Leave type with this name already exists") {
                return res.status(400).json({ success: false, error: error.message });
            }
            next(error);
        }
    }
    // Update leave type
    async update(req, res, next) {
        try {
            const workspaceId = req.user.workspaceId;
            const id = req.params.id; // FIXED: Cast to string
            const { name, description, color, isPaid, defaultDays, requiresApproval, isActive, } = req.body;
            const leaveType = await leaveTypesService.update(workspaceId, id, {
                name: name?.trim(),
                description: description?.trim(),
                color,
                isPaid,
                defaultDays,
                requiresApproval,
                isActive,
            });
            if (!leaveType) {
                return res
                    .status(404)
                    .json({ success: false, error: "Leave type not found" });
            }
            res.json({ success: true, data: leaveType });
        }
        catch (error) {
            if (error.message === "Leave type with this name already exists") {
                return res.status(400).json({ success: false, error: error.message });
            }
            next(error);
        }
    }
    // Delete leave type
    async delete(req, res, next) {
        try {
            const workspaceId = req.user.workspaceId;
            const id = req.params.id; // FIXED: Cast to string
            const deleted = await leaveTypesService.delete(workspaceId, id);
            if (!deleted) {
                return res
                    .status(404)
                    .json({ success: false, error: "Leave type not found" });
            }
            res.json({ success: true, message: "Leave type deleted successfully" });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.LeaveTypesController = LeaveTypesController;
