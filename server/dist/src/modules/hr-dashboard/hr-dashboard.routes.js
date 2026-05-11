"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/modules/hr-dashboard/hr-dashboard.routes.ts
const express_1 = require("express");
const hr_dashboard_controller_1 = require("./hr-dashboard.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const router = (0, express_1.Router)();
const hrDashboardController = new hr_dashboard_controller_1.HRDashboardController();
router.use(auth_middleware_1.authenticate);
router.get("/kpi", hrDashboardController.getKPI);
router.get("/charts", hrDashboardController.getCharts);
router.get("/employees", hrDashboardController.getEmployees);
exports.default = router;
