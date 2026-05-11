"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeamService = void 0;
// src/modules/teams/team.service.ts
const drizzle_1 = require("../../db/drizzle");
const schema_1 = require("../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const uuid_1 = require("uuid");
class TeamService {
    /**
     * Get all teams in a workspace with member counts
     */
    async getWorkspaceTeams(workspaceId, search) {
        const teamList = await drizzle_1.db
            .select({
            id: schema_1.teams.id,
            name: schema_1.teams.name,
            description: schema_1.teams.description,
            color: schema_1.teams.color,
            workspaceId: schema_1.teams.workspaceId,
        })
            .from(schema_1.teams)
            .where(search
            ? (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.teams.workspaceId, workspaceId), (0, drizzle_orm_1.like)(schema_1.teams.name, `%${search}%`))
            : (0, drizzle_orm_1.eq)(schema_1.teams.workspaceId, workspaceId));
        // Get members for each team
        const teamsWithMembers = await Promise.all(teamList.map(async (team) => {
            const members = await drizzle_1.db
                .select({
                id: schema_1.users.id,
                name: schema_1.users.name,
                email: schema_1.users.email,
                avatar: schema_1.users.avatar,
            })
                .from(schema_1.users)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.users.teamId, team.id), (0, drizzle_orm_1.eq)(schema_1.users.workspaceId, workspaceId)));
            return {
                ...team,
                description: team.description || "",
                members: members.map((m) => ({
                    id: m.id,
                    name: m.name,
                    email: m.email,
                    initials: m.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2),
                })),
                memberCount: members.length,
                createdAt: new Date().toISOString(),
            };
        }));
        return teamsWithMembers;
    }
    /**
     * Get a single team by ID
     */
    async getTeamById(teamId) {
        const [team] = await drizzle_1.db
            .select()
            .from(schema_1.teams)
            .where((0, drizzle_orm_1.eq)(schema_1.teams.id, teamId))
            .limit(1);
        if (!team)
            throw new Error("Team not found");
        const members = await drizzle_1.db
            .select({
            id: schema_1.users.id,
            name: schema_1.users.name,
            email: schema_1.users.email,
            avatar: schema_1.users.avatar,
        })
            .from(schema_1.users)
            .where((0, drizzle_orm_1.eq)(schema_1.users.teamId, team.id));
        return {
            ...team,
            members: members.map((m) => ({
                id: m.id,
                name: m.name,
                email: m.email,
                initials: m.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2),
            })),
            memberCount: members.length,
        };
    }
    /**
     * Create a new team
     */
    async createTeam(input, workspaceId) {
        const { name, description, color } = input;
        // Check if team name already exists in workspace
        const existing = await drizzle_1.db
            .select()
            .from(schema_1.teams)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.teams.name, name), (0, drizzle_orm_1.eq)(schema_1.teams.workspaceId, workspaceId)))
            .limit(1);
        if (existing.length > 0) {
            throw new Error("A team with this name already exists in this workspace");
        }
        const teamId = (0, uuid_1.v4)();
        await drizzle_1.db.insert(schema_1.teams).values({
            id: teamId,
            name,
            description: description || "",
            workspaceId,
            color: color || "#6366f1",
        });
        return this.getTeamById(teamId);
    }
    /**
     * Update a team
     */
    async updateTeam(teamId, input) {
        const [team] = await drizzle_1.db
            .select()
            .from(schema_1.teams)
            .where((0, drizzle_orm_1.eq)(schema_1.teams.id, teamId))
            .limit(1);
        if (!team)
            throw new Error("Team not found");
        const updateData = {};
        if (input.name)
            updateData.name = input.name;
        if (input.description !== undefined)
            updateData.description = input.description;
        if (input.color)
            updateData.color = input.color;
        await drizzle_1.db.update(schema_1.teams).set(updateData).where((0, drizzle_orm_1.eq)(schema_1.teams.id, teamId));
        return this.getTeamById(teamId);
    }
    /**
     * Delete a team
     */
    async deleteTeam(teamId) {
        const [team] = await drizzle_1.db
            .select()
            .from(schema_1.teams)
            .where((0, drizzle_orm_1.eq)(schema_1.teams.id, teamId))
            .limit(1);
        if (!team)
            throw new Error("Team not found");
        // Remove team from users
        await drizzle_1.db
            .update(schema_1.users)
            .set({ teamId: null, team: null })
            .where((0, drizzle_orm_1.eq)(schema_1.users.teamId, teamId));
        // Delete the team
        await drizzle_1.db.delete(schema_1.teams).where((0, drizzle_orm_1.eq)(schema_1.teams.id, teamId));
        return { success: true, message: "Team deleted successfully" };
    }
    /**
     * Add a member to a team
     */
    async addTeamMember(teamId, userId) {
        const [team] = await drizzle_1.db
            .select()
            .from(schema_1.teams)
            .where((0, drizzle_orm_1.eq)(schema_1.teams.id, teamId))
            .limit(1);
        if (!team)
            throw new Error("Team not found");
        const [user] = await drizzle_1.db
            .select()
            .from(schema_1.users)
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, userId))
            .limit(1);
        if (!user)
            throw new Error("User not found");
        await drizzle_1.db
            .update(schema_1.users)
            .set({ teamId: team.id, team: team.name })
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, userId));
        return this.getTeamById(teamId);
    }
    /**
     * Remove a member from a team
     */
    async removeTeamMember(teamId, userId) {
        await drizzle_1.db
            .update(schema_1.users)
            .set({ teamId: null, team: null })
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.users.id, userId), (0, drizzle_orm_1.eq)(schema_1.users.teamId, teamId)));
        return this.getTeamById(teamId);
    }
    /**
     * Get available users for a team (users not in any team)
     */
    async getAvailableUsers(workspaceId) {
        return drizzle_1.db
            .select({
            id: schema_1.users.id,
            name: schema_1.users.name,
            email: schema_1.users.email,
            avatar: schema_1.users.avatar,
        })
            .from(schema_1.users)
            .innerJoin(schema_1.workspaceMembers, (0, drizzle_orm_1.eq)(schema_1.users.id, schema_1.workspaceMembers.userId))
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.workspaceMembers.workspaceId, workspaceId), (0, drizzle_orm_1.eq)(schema_1.users.isActive, true)));
    }
}
exports.TeamService = TeamService;
