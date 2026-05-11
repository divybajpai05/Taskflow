"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/modules/leave-types/leave-types.routes.ts
const express_1 = require("express");
const leave_types_controller_1 = require("./leave-types.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const router = (0, express_1.Router)();
const controller = new leave_types_controller_1.LeaveTypesController();
router.use(auth_middleware_1.authenticate);
router.get("/", controller.getAll.bind(controller));
router.get("/active", controller.getActive.bind(controller));
router.get("/:id", controller.getById.bind(controller));
router.post("/", controller.create.bind(controller));
router.put("/:id", controller.update.bind(controller));
router.delete("/:id", controller.delete.bind(controller));
exports.default = router;
