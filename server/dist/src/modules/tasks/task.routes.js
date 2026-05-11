"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/modules/tasks/task.routes.ts
const express_1 = require("express");
const task_controller_1 = require("./task.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const router = (0, express_1.Router)();
const taskController = new task_controller_1.TaskController();
router.use(auth_middleware_1.authenticate);
router.get("/", taskController.getTasks);
router.get("/teams", taskController.getTeams);
router.post("/", taskController.createTask);
router.put("/:id", taskController.updateTask);
router.delete("/:id", taskController.deleteTask);
exports.default = router;
