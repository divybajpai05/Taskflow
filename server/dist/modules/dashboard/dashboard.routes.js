"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/modules/dashboard/dashboard.routes.ts
const express_1 = require("express");
const dashboard_controller_1 = require("./dashboard.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const router = (0, express_1.Router)();
const dashboardController = new dashboard_controller_1.DashboardController();
router.use(auth_middleware_1.authenticate);
router.get("/overview", dashboardController.getOverview);
router.get("/active-tasks", dashboardController.getActiveTasks);
router.get("/team-workload", dashboardController.getTeamWorkload);
router.get("/overdue", dashboardController.getOverdueTasks);
router.get("/live-activity", dashboardController.getLiveActivity);
exports.default = router;
