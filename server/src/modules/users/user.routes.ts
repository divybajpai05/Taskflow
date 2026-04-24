// src/modules/users/user.routes.ts
import { Router } from "express";
import { UserController } from "./user.controller";
import {
  authenticate,
  requirePermission,
} from "../../middlewares/auth.middleware";

const router = Router();
const userController = new UserController();

// All routes require authentication + user_management permission
router.use(authenticate);
router.use(requirePermission("user_management"));

// User CRUD
router.get("/", userController.getUsers);
router.get("/:id", userController.getUserById);
router.post("/", userController.createUser);
router.put("/:id", userController.updateUser);
router.delete("/:id", userController.deleteUser);

// Permission overrides
router.put("/:id/permissions", userController.updateUserPermissions);
router.post("/:id/permissions", userController.addUserPermission);
router.delete(
  "/:id/permissions/:permissionId",
  userController.removeUserPermission,
);

// Roles & Permissions (reference data)
router.get("/roles/list", userController.getRoles);
router.get("/permissions/list", userController.getPermissions);

export default router;
