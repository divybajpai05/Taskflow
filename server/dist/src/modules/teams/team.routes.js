"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/modules/teams/team.routes.ts
const express_1 = require("express");
const team_controller_1 = require("./team.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const router = (0, express_1.Router)();
const teamController = new team_controller_1.TeamController();
router.use(auth_middleware_1.authenticate);
router.get("/", teamController.getTeams);
router.get("/available-users", teamController.getAvailableUsers);
router.get("/:id", teamController.getTeamById);
router.post("/", teamController.createTeam);
router.put("/:id", teamController.updateTeam);
router.delete("/:id", teamController.deleteTeam);
router.post("/:id/members", teamController.addTeamMember);
router.delete("/:id/members/:userId", teamController.removeTeamMember);
exports.default = router;
