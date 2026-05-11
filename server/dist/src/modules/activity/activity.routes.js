"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/modules/activity/activity.routes.ts
const express_1 = require("express");
const activity_controller_1 = require("./activity.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const router = (0, express_1.Router)();
const activityController = new activity_controller_1.ActivityController();
// All routes require authentication
router.use(auth_middleware_1.authenticate);
// GET /api/activities
router.get("/", activityController.getActivities);
router.get("/event-types", activityController.getEventTypes);
exports.default = router;
