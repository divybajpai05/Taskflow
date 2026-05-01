// src/modules/workspaces/workspace.routes.ts
import { Router } from "express";
import { WorkspaceController } from "./workspace.controller";
import { authenticate } from "../../middlewares/auth.middleware";

const router = Router();
const workspaceController = new WorkspaceController();
router.use(authenticate);

// router.post("/:id/switch", workspaceController.switchWorkspace);
router.post(
  "/:id/switch",
  (req, res, next) => {
    console.log("🔵 Route HIT: /workspaces/:id/switch");
    console.log("🔵 Params:", req.params);
    console.log("🔵 Headers:", req.headers["x-workspace-id"]);
    next();
  },
  workspaceController.switchWorkspace,
);
router.get("/", workspaceController.getWorkspaces);
router.get("/:id", workspaceController.getWorkspaceById);
router.post("/", workspaceController.createWorkspace);
router.put("/:id", workspaceController.updateWorkspace);
router.delete("/:id", workspaceController.deleteWorkspace);

export default router;
