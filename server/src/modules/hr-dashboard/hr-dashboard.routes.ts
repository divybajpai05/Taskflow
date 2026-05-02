// src/modules/hr-dashboard/hr-dashboard.routes.ts
import { Router } from "express";
import { HRDashboardController } from "./hr-dashboard.controller";
import { authenticate } from "../../middlewares/auth.middleware";

const router = Router();
const hrDashboardController = new HRDashboardController();

router.use(authenticate);

router.get("/kpi", hrDashboardController.getKPI);
router.get("/charts", hrDashboardController.getCharts);
router.get("/employees", hrDashboardController.getEmployees);

export default router;
