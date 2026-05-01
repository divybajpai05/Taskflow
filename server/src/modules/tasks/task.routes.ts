// src/modules/tasks/task.routes.ts
import { Router } from "express";
import { TaskController } from "./task.controller";
import { authenticate } from "../../middlewares/auth.middleware";

const router = Router();
const taskController = new TaskController();

router.use(authenticate);

router.get("/", taskController.getTasks);
router.get("/teams", taskController.getTeams);
router.post("/", taskController.createTask);
router.put("/:id", taskController.updateTask);
router.delete("/:id", taskController.deleteTask);

export default router;
