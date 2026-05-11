"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaveController = void 0;
const leave_service_1 = require("./leave.service");
const leaveService = new leave_service_1.LeaveService();
class LeaveController {
    async getLeaves(req, res, next) {
        try {
            const workspaceId = req.user.workspaceId;
            const { status, leaveType, department, search } = req.query;
            const leaves = await leaveService.getLeaves(workspaceId, {
                status: status,
                leaveType: leaveType,
                department: department,
                search: search,
            });
            res.json({ success: true, data: leaves, count: leaves.length });
        }
        catch (error) {
            next(error);
        }
    }
    async getStats(req, res, next) {
        try {
            const workspaceId = req.user.workspaceId;
            const stats = await leaveService.getLeaveStats(workspaceId);
            res.json({ success: true, data: stats });
        }
        catch (error) {
            next(error);
        }
    }
    async createLeave(req, res, next) {
        try {
            const workspaceId = req.user.workspaceId;
            const input = req.body;
            if (!input.userId) {
                return res
                    .status(400)
                    .json({ success: false, error: "userId is required" });
            }
            const result = await leaveService.createLeave(input, workspaceId);
            res.status(201).json(result);
        }
        catch (error) {
            next(error);
        }
    }
    async updateStatus(req, res, next) {
        try {
            const leaveId = req.params.id;
            const approvedById = req.user.id;
            const { status } = req.body;
            if (!status) {
                return res
                    .status(400)
                    .json({ success: false, error: "status is required" });
            }
            const result = await leaveService.updateLeaveStatus(leaveId, {
                status,
                approvedById,
            });
            res.json(result);
        }
        catch (error) {
            next(error);
        }
    }
    async deleteLeave(req, res, next) {
        try {
            const leaveId = req.params.id;
            const result = await leaveService.deleteLeave(leaveId);
            res.json(result);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.LeaveController = LeaveController;
