// src/modules/kanban/kanban.routes.ts
import { Router } from "express";
import { KanbanController } from "./kanban.controller";
import { authenticate } from "../../middlewares/auth.middleware";

const router = Router();
const kanbanController = new KanbanController();

router.use(authenticate);

router.get("/board", kanbanController.getBoard);
router.patch("/move", kanbanController.moveTask);

export default router;
