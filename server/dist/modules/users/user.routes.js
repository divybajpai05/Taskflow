"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/modules/users/user.routes.ts
const express_1 = require("express");
const user_controller_1 = require("./user.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const user_service_1 = require("./user.service");
const router = (0, express_1.Router)();
const userController = new user_controller_1.UserController();
const userService = new user_service_1.UserService();
// All routes require authentication + user_management permission
router.use(auth_middleware_1.authenticate);
router.get("/workspace-members", async (req, res, next) => {
    try {
        const workspaceId = req.user.workspaceId;
        const members = await userService.getWorkspaceUsers(workspaceId);
        res.json({ success: true, data: members });
    }
    catch (error) {
        next(error);
    }
});
router.use((0, auth_middleware_1.requirePermission)("user_management"));
// User CRUD
router.get("/", userController.getUsers);
router.get("/:id", userController.getUserById);
router.post("/", userController.createUser);
router.put("/:id", userController.updateUser);
router.delete("/:id", userController.deleteUser);
// Permission overrides
router.put("/:id/permissions", userController.updateUserPermissions);
router.post("/:id/permissions", userController.addUserPermission);
router.delete("/:id/permissions/:permissionId", userController.removeUserPermission);
// Roles & Permissions (reference data)
router.get("/roles/list", userController.getRoles);
router.get("/permissions/list", userController.getPermissions);
// change password
router.put("/password", auth_middleware_1.authenticate, userController.changePassword);
exports.default = router;
