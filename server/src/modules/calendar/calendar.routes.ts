// src/modules/calendar/calendar.routes.ts
import { Router } from "express";
import { CalendarController } from "./calendar.controller";
import { authenticate } from "../../middlewares/auth.middleware";

const router = Router();
const calendarController = new CalendarController();

router.use(authenticate);

router.get("/tasks", calendarController.getTasks);
router.patch("/tasks/move", calendarController.moveTask);
router.get("/events", calendarController.getAllEvents);

export default router;
