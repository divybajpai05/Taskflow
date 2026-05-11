"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/modules/calendar/calendar.routes.ts
const express_1 = require("express");
const calendar_controller_1 = require("./calendar.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const router = (0, express_1.Router)();
const calendarController = new calendar_controller_1.CalendarController();
router.use(auth_middleware_1.authenticate);
router.get("/tasks", calendarController.getTasks);
router.patch("/tasks/move", calendarController.moveTask);
router.get("/events", calendarController.getAllEvents);
exports.default = router;
