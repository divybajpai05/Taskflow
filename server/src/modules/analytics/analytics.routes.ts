// src/modules/analytics/analytics.routes.ts
import { Router } from "express";
import { AnalyticsController } from "./analytics.controller";
import { authenticate } from "../../middlewares/auth.middleware";

const router = Router();
const analyticsController = new AnalyticsController();

router.use(authenticate);

router.get("/kpi", analyticsController.getKPI);
router.get("/charts", analyticsController.getCharts);
router.get("/team", analyticsController.getTeamPerformance);
router.get("/tasks", analyticsController.getTaskDetails);

router.get("/team-workload", analyticsController.getTeamWorkload);
router.get("/team-completion-rate", analyticsController.getTeamCompletionRate);
router.get("/priority-trends", analyticsController.getPriorityTrends);
router.get("/attendance-trend", analyticsController.getAttendanceTrend);
router.get("/employee-distribution", analyticsController.getEmployeeDistribution);
router.get("/leave-trends", analyticsController.getLeaveTrends);

export default router;
