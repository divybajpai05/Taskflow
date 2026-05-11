"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/modules/workspaces/workspace.routes.ts
const express_1 = require("express");
const workspace_controller_1 = require("./workspace.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const router = (0, express_1.Router)();
const workspaceController = new workspace_controller_1.WorkspaceController();
router.use(auth_middleware_1.authenticate);
// router.post("/:id/switch", workspaceController.switchWorkspace);
router.post("/:id/switch", (req, res, next) => {
    console.log("🔵 Route HIT: /workspaces/:id/switch");
    console.log("🔵 Params:", req.params);
    console.log("🔵 Headers:", req.headers["x-workspace-id"]);
    next();
}, workspaceController.switchWorkspace);
router.get("/", workspaceController.getWorkspaces);
router.get("/:id", workspaceController.getWorkspaceById);
router.post("/", workspaceController.createWorkspace);
router.put("/:id", workspaceController.updateWorkspace);
router.delete("/:id", workspaceController.deleteWorkspace);
exports.default = router;
