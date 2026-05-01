// src/modules/dashboard/dashboard.routes.ts
import { Router } from "express";
import { DashboardController } from "./dashboard.controller";
import { authenticate } from "../../middlewares/auth.middleware";

const router = Router();
const dashboardController = new DashboardController();

router.use(authenticate);

router.get("/overview", dashboardController.getOverview);
router.get("/active-tasks", dashboardController.getActiveTasks);
router.get("/team-workload", dashboardController.getTeamWorkload);
router.get("/overdue", dashboardController.getOverdueTasks);
router.get("/live-activity", dashboardController.getLiveActivity);


export default router;
