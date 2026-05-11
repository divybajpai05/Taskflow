"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/modules/analytics/analytics.routes.ts
const express_1 = require("express");
const analytics_controller_1 = require("./analytics.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const router = (0, express_1.Router)();
const analyticsController = new analytics_controller_1.AnalyticsController();
router.use(auth_middleware_1.authenticate);
router.get("/kpi", analyticsController.getKPI);
router.get("/charts", analyticsController.getCharts);
router.get("/team", analyticsController.getTeamPerformance);
router.get("/tasks", analyticsController.getTaskDetails);
exports.default = router;
