"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/modules/roles/role.routes.ts
const express_1 = require("express");
const role_controller_1 = require("./role.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const router = (0, express_1.Router)();
const roleController = new role_controller_1.RoleController();
// All routes require authentication + user_management permission
router.use(auth_middleware_1.authenticate);
router.use((0, auth_middleware_1.requirePermission)("role_management"));
// Role CRUD
router.get("/", roleController.getRoles);
router.get("/permissions/list", roleController.getPermissions);
router.get("/:id", roleController.getRoleById);
router.post("/", roleController.createRole);
router.put("/:id", roleController.updateRole);
router.delete("/:id", roleController.deleteRole);
exports.default = router;
