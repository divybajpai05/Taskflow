"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/modules/leaves/leave.routes.ts
const express_1 = require("express");
const leave_controller_1 = require("./leave.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const router = (0, express_1.Router)();
const leaveController = new leave_controller_1.LeaveController();
router.use(auth_middleware_1.authenticate);
router.get("/", leaveController.getLeaves);
router.get("/stats", leaveController.getStats);
router.get("/balance", leaveController.getBalance);
router.get("/my", leaveController.getMyLeaves);
router.post("/", leaveController.createLeave);
router.put("/:id", leaveController.updateStatus);
router.delete("/:id", leaveController.deleteLeave);
exports.default = router;
