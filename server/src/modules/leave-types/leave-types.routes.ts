// src/modules/leave-types/leave-types.routes.ts
import { Router } from "express";
import { LeaveTypesController } from "./leave-types.controller";
import { authenticate } from "../../middlewares/auth.middleware";

const router = Router();
const controller = new LeaveTypesController();

router.use(authenticate);

router.get("/", controller.getAll.bind(controller));
router.get("/active", controller.getActive.bind(controller));
router.get("/:id", controller.getById.bind(controller));
router.post("/", controller.create.bind(controller));
router.put("/:id", controller.update.bind(controller));
router.delete("/:id", controller.delete.bind(controller));

export default router;
