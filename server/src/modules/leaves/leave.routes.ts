// src/modules/leaves/leave.routes.ts
import { Router } from "express";
import { LeaveController } from "./leave.controller";
import { authenticate } from "../../middlewares/auth.middleware";

const router = Router();
const leaveController = new LeaveController();

router.use(authenticate);

router.get("/", leaveController.getLeaves);
router.get("/stats", leaveController.getStats);
router.get("/balance", leaveController.getBalance);
router.get("/my", leaveController.getMyLeaves);
router.post("/", leaveController.createLeave);
router.put("/:id", leaveController.updateStatus);
router.delete("/:id", leaveController.deleteLeave);

export default router;
