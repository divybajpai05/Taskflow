// src/modules/activity/activity.routes.ts
import { Router } from "express";
import { ActivityController } from "./activity.controller";
import { authenticate } from "../../middlewares/auth.middleware";

const router = Router();
const activityController = new ActivityController();

// All routes require authentication
router.use(authenticate);

// GET /api/activities
router.get("/", activityController.getActivities);
router.get("/event-types", activityController.getEventTypes);


export default router;
