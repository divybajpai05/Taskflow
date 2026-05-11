"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HRDashboardController = void 0;
const hr_dashboard_service_1 = require("./hr-dashboard.service");
const hrDashboardService = new hr_dashboard_service_1.HRDashboardService();
class HRDashboardController {
    async getKPI(req, res, next) {
        try {
            const workspaceId = req.user.workspaceId;
            const department = req.query.department;
            const dateFrom = req.query.dateFrom;
            const dateTo = req.query.dateTo;
            const data = await hrDashboardService.getKPIData(workspaceId, department, dateFrom, dateTo);
            res.json({ success: true, data });
        }
        catch (error) {
            next(error);
        }
    }
    async getCharts(req, res, next) {
        try {
            const workspaceId = req.user.workspaceId;
            const department = req.query.department;
            const dateFrom = req.query.dateFrom;
            const dateTo = req.query.dateTo;
            const data = await hrDashboardService.getChartData(workspaceId, department, dateFrom, dateTo);
            res.json({ success: true, data });
        }
        catch (error) {
            next(error);
        }
    }
    async getEmployees(req, res, next) {
        try {
            const workspaceId = req.user.workspaceId;
            const department = req.query.department;
            const data = await hrDashboardService.getEmployeeLists(workspaceId, department);
            res.json({ success: true, data });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.HRDashboardController = HRDashboardController;
