"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/modules/attendance/attendance.routes.ts
const express_1 = require("express");
const attendance_controller_1 = require("./attendance.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const router = (0, express_1.Router)();
const attendanceController = new attendance_controller_1.AttendanceController();
router.use(auth_middleware_1.authenticate);
router.get("/", attendanceController.getAttendance);
router.get("/stats", attendanceController.getStats);
router.get("/monthly", attendanceController.getMonthlyStats);
router.post("/", attendanceController.markAttendance);
router.post("/bulk", attendanceController.bulkMarkAttendance);
router.get("/calendar-monthly", attendanceController.getCalendarMonthly);
exports.default = router;
