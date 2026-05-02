// src/modules/hr-calendar/hr-calendar.routes.ts
import { Router } from "express";
import { HRCalendarController } from "./hr-calendar.controller";
import { authenticate } from "../../middlewares/auth.middleware";

const router = Router();
const hrCalendarController = new HRCalendarController();

router.use(authenticate);

router.get("/events", hrCalendarController.getEvents);

export default router;
