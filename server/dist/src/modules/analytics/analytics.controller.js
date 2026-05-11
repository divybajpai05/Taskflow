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
}
exports.AnalyticsController = AnalyticsController;
