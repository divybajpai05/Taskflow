"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/modules/hr-calendar/hr-calendar.routes.ts
const express_1 = require("express");
const hr_calendar_controller_1 = require("./hr-calendar.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const router = (0, express_1.Router)();
const hrCalendarController = new hr_calendar_controller_1.HRCalendarController();
router.use(auth_middleware_1.authenticate);
router.get("/events", hrCalendarController.getEvents);
exports.default = router;
