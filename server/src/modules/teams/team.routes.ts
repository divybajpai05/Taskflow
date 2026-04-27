// src/modules/teams/team.routes.ts
import { Router } from "express";
import { TeamController } from "./team.controller";
import { authenticate } from "../../middlewares/auth.middleware";

const router = Router();
const teamController = new TeamController();

router.use(authenticate);

router.get("/", teamController.getTeams);
router.get("/available-users", teamController.getAvailableUsers);
router.get("/:id", teamController.getTeamById);
router.post("/", teamController.createTeam);
router.put("/:id", teamController.updateTeam);
router.delete("/:id", teamController.deleteTeam);
router.post("/:id/members", teamController.addTeamMember);
router.delete("/:id/members/:userId", teamController.removeTeamMember);

export default router;
