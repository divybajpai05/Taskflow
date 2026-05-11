"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/modules/kanban/kanban.routes.ts
const express_1 = require("express");
const kanban_controller_1 = require("./kanban.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const router = (0, express_1.Router)();
const kanbanController = new kanban_controller_1.KanbanController();
router.use(auth_middleware_1.authenticate);
router.get("/board", kanbanController.getBoard);
router.patch("/move", kanbanController.moveTask);
exports.default = router;
