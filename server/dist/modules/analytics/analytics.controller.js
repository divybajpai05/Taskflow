"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsController = void 0;
const analytics_service_1 = require("./analytics.service");
const analyticsService = new analytics_service_1.AnalyticsService();
class AnalyticsController {
    async getKPI(req, res, next) {
        try {
            const workspaceId = req.user.workspaceId;
            const { dateFrom, dateTo, memberId, teamId, status, priority } = req.query;
            const data = await analyticsService.getKPIData(workspaceId, dateFrom, dateTo, memberId, teamId, status, priority);
            res.json({ success: true, data });
        }
        catch (error) {
            next(error);
        }
    }
    async getCharts(req, res, next) {
        try {
            const workspaceId = req.user.workspaceId;
            const { dateFrom, dateTo, memberId, teamId, status, priority } = req.query;
            const data = await analyticsService.getChartData(workspaceId, dateFrom, dateTo, memberId, teamId, status, priority);
            res.json({ success: true, data });
        }
        catch (error) {
            next(error);
        }
    }
    async getTeamPerformance(req, res, next) {
        try {
            const workspaceId = req.user.workspaceId;
            const { dateFrom, dateTo, memberId, teamId } = req.query;
            const data = await analyticsService.getTeamPerformance(workspaceId, dateFrom, dateTo, memberId, teamId);
            res.json({ success: true, data });
        }
        catch (error) {
            next(error);
        }
    }
    async getTaskDetails(req, res, next) {
        try {
            const workspaceId = req.user.workspaceId;
            const { dateFrom, dateTo, memberId, teamId, status, priority } = req.query;
            const data = await analyticsService.getTaskDetails(workspaceId, dateFrom, dateTo, memberId, teamId, status, priority);
            res.json({ success: true, data });
        }
        catch (error) {
            next(error);
        }
    }
    // Add these methods to AnalyticsController:
    async getTeamWorkload(req, res, next) {
        try {
            const workspaceId = req.user.workspaceId;
            const { dateFrom, dateTo } = req.query;
            const data = await analyticsService.getTeamWorkload(workspaceId, dateFrom, dateTo);
            res.json({ success: true, data });
        }
        catch (error) {
            next(error);
        }
    }
    async getTeamCompletionRate(req, res, next) {
        try {
            const workspaceId = req.user.workspaceId;
            const { dateFrom, dateTo } = req.query;
            const data = await analyticsService.getTeamCompletionRate(workspaceId, dateFrom, dateTo);
            res.json({ success: true, data });
        }
        catch (error) {
            next(error);
        }
    }
    async getPriorityTrends(req, res, next) {
        try {
            const workspaceId = req.user.workspaceId;
            const { dateFrom, dateTo } = req.query;
            const data = await analyticsService.getPriorityTrends(workspaceId, dateFrom, dateTo);
            res.json({ success: true, data });
        }
        catch (error) {
            next(error);
        }
    }
    async getAttendanceTrend(req, res, next) {
        try {
            const workspaceId = req.user.workspaceId;
            const { dateFrom, dateTo } = req.query;
            const data = await analyticsService.getAttendanceTrend(workspaceId, dateFrom, dateTo);
            res.json({ success: true, data });
        }
        catch (error) {
            next(error);
        }
    }
    async getEmployeeDistribution(req, res, next) {
        try {
            const workspaceId = req.user.workspaceId;
            const data = await analyticsService.getEmployeeDistribution(workspaceId);
            res.json({ success: true, data });
        }
        catch (error) {
            next(error);
        }
    }
    async getLeaveTrends(req, res, next) {
        try {
            const workspaceId = req.user.workspaceId;
            const { dateFrom, dateTo } = req.query;
            const data = await analyticsService.getLeaveTrends(workspaceId, dateFrom, dateTo);
            res.json({ success: true, data });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AnalyticsController = AnalyticsController;
