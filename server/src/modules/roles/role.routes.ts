// src/modules/roles/role.routes.ts
import { Router } from "express";
import { RoleController } from "./role.controller";
import {
  authenticate,
  requirePermission,
} from "../../middlewares/auth.middleware";

const router = Router();
const roleController = new RoleController();

// All routes require authentication + user_management permission
router.use(authenticate);
router.use(requirePermission("role_management"));

// Role CRUD
router.get("/", roleController.getRoles);
router.get("/permissions/list", roleController.getPermissions);
router.get("/:id", roleController.getRoleById);
router.post("/", roleController.createRole);
router.put("/:id", roleController.updateRole);
router.delete("/:id", roleController.deleteRole);

export default router;
 