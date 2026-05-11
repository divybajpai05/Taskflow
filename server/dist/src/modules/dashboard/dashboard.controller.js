"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardController = void 0;
const dashboard_service_1 = require("./dashboard.service");
const dashboardService = new dashboard_service_1.DashboardService();
class DashboardController {
    async getOverview(req, res, next) {
        try {
            const workspaceId = req.user.workspaceId;
            const userId = req.user.id;
            const userPermissions = req.user.permissions || [];
            const userTeamId = req.user?.teamId || null;
            const stats = await dashboardService.getOverviewStats(workspaceId, userId, userPermissions, userTeamId);
            res.json({ success: true, data: stats });
        }
        catch (error) {
            next(error);
        }
    }
    async getActiveTasks(req, res, next) {
        try {
            const workspaceId = req.user.workspaceId;
            const userId = req.user.id;
            const userPermissions = req.user.permissions || [];
            const userTeamId = req.user?.teamId || null;
            const limit = parseInt(req.query.limit) || 5;
            const offset = parseInt(req.query.offset) || 0;
            const data = await dashboardService.getActiveTasks(workspaceId, userId, userPermissions, userTeamId, limit, offset);
            res.json({ success: true, data });
        }
        catch (error) {
            next(error);
        }
    }
    async getTeamWorkload(req, res, next) {
        try {
            const workspaceId = req.user.workspaceId;
            const userId = req.user.id;
            const userPermissions = req.user.permissions || [];
            const userTeamId = req.user?.teamId || null;
            const data = await dashboardService.getTeamWorkload(workspaceId, userId, userPermissions, userTeamId);
            res.json({ success: true, data });
        }
        catch (error) {
            next(error);
        }
    }
    async getOverdueTasks(req, res, next) {
        try {
            const workspaceId = req.user.workspaceId;
            const userId = req.user.id;
            const userPermissions = req.user.permissions || [];
            const userTeamId = req.user?.teamId || null;
            const data = await dashboardService.getOverdueTasks(workspaceId, userId, userPermissions, userTeamId);
            res.json({ success: true, data });
        }
        catch (error) {
            next(error);
        }
    }
    // In dashboard.controller.ts
    async getLiveActivity(req, res, next) {
        try {
            const workspaceId = req.user.workspaceId;
            const userId = req.user.id;
            const userPermissions = req.user.permissions || [];
            const userTeamId = req.user?.teamId || null;
            const limit = parseInt(req.query.limit) || 10;
            const data = await dashboardService.getLiveActivity(workspaceId, userId, userPermissions, userTeamId, limit);
            // ✅ Return both activities array and total count
            res.json({
                success: true,
                data: data.activities,
                total: data.total,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.DashboardController = DashboardController;
