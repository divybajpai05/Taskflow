// src/modules/attendance/attendance.routes.ts
import { Router } from "express";
import { AttendanceController } from "./attendance.controller";
import { authenticate } from "../../middlewares/auth.middleware";

const router = Router();
const attendanceController = new AttendanceController();

router.use(authenticate);

router.get("/", attendanceController.getAttendance);
router.get("/stats", attendanceController.getStats);
router.get("/monthly", attendanceController.getMonthlyStats);
router.post("/", attendanceController.markAttendance);
router.post("/bulk", attendanceController.bulkMarkAttendance);
router.get("/calendar-monthly", attendanceController.getCalendarMonthly);


export default router;
