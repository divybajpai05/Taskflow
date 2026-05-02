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

export default router;
