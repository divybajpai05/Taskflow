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
    async getWorkspaceTeams(workspaceId, userId, userPermissions, search) {
        const canSeeAllTeams = userPermissions.includes("user_management") ||
            userPermissions.includes("hr_dashboard");
        // ✅ Build conditions array instead of reassigning query
        const conditions = [(0, drizzle_orm_1.eq)(schema_1.teams.workspaceId, workspaceId)];
        if (search) {
            conditions.push((0, drizzle_orm_1.like)(schema_1.teams.name, `%${search}%`));
        }
        if (!canSeeAllTeams) {
            // Only user's own team
            const [userMember] = await drizzle_1.db
                .select({ teamId: schema_1.workspaceMembers.teamId })
                .from(schema_1.workspaceMembers)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.workspaceMembers.userId, userId), (0, drizzle_orm_1.eq)(schema_1.workspaceMembers.workspaceId, workspaceId)))
                .limit(1);
            if (!userMember?.teamId) {
                return [];
            }
            conditions.push((0, drizzle_orm_1.eq)(schema_1.teams.id, userMember.teamId));
        }
        // ✅ Single query with all conditions
        const teamList = await drizzle_1.db
            .select({
            id: schema_1.teams.id,
            name: schema_1.teams.name,
            description: schema_1.teams.description,
            color: schema_1.teams.color,
            workspaceId: schema_1.teams.workspaceId,
        })
            .from(schema_1.teams)
            .where((0, drizzle_orm_1.and)(...conditions));
        // Get members for each team
        const teamsWithMembers = await Promise.all(teamList.map(async (team) => {
            const members = await drizzle_1.db
                .select({
                id: schema_1.users.id,
                name: schema_1.users.name,
                email: schema_1.users.email,
                avatar: schema_1.users.avatar,
            })
                .from(schema_1.workspaceMembers)
                .innerJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.workspaceMembers.userId, schema_1.users.id))
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.workspaceMembers.teamId, team.id), (0, drizzle_orm_1.eq)(schema_1.workspaceMembers.workspaceId, workspaceId)));
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
        // FIXED: Get members from workspace_members
        const members = await drizzle_1.db
            .select({
            id: schema_1.users.id,
            name: schema_1.users.name,
            email: schema_1.users.email,
            avatar: schema_1.users.avatar,
        })
            .from(schema_1.workspaceMembers)
            .innerJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.workspaceMembers.userId, schema_1.users.id))
            .where((0, drizzle_orm_1.eq)(schema_1.workspaceMembers.teamId, team.id));
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
        const [existing] = await drizzle_1.db
            .select()
            .from(schema_1.teams)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.teams.name, name), (0, drizzle_orm_1.eq)(schema_1.teams.workspaceId, workspaceId)))
            .limit(1);
        if (existing) {
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
        // FIXED: Remove team from workspace_members (not users table)
        await drizzle_1.db
            .update(schema_1.workspaceMembers)
            .set({ teamId: null })
            .where((0, drizzle_orm_1.eq)(schema_1.workspaceMembers.teamId, teamId));
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
        // FIXED: Update workspace_members instead of users table
        // Check if user is already in workspace_members for this workspace
        const [existingMember] = await drizzle_1.db
            .select()
            .from(schema_1.workspaceMembers)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.workspaceMembers.userId, userId), (0, drizzle_orm_1.eq)(schema_1.workspaceMembers.workspaceId, team.workspaceId)))
            .limit(1);
        if (existingMember) {
            await drizzle_1.db
                .update(schema_1.workspaceMembers)
                .set({ teamId: team.id })
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.workspaceMembers.userId, userId), (0, drizzle_orm_1.eq)(schema_1.workspaceMembers.workspaceId, team.workspaceId)));
        }
        else {
            // Add to workspace_members with this team
            await drizzle_1.db.insert(schema_1.workspaceMembers).values({
                id: (0, uuid_1.v4)(),
                userId: userId,
                workspaceId: team.workspaceId,
                roleId: "", // You may want to assign a default role
                teamId: team.id,
            });
        }
        return this.getTeamById(teamId);
    }
    /**
     * Remove a member from a team
     */
    async removeTeamMember(teamId, userId) {
        // FIXED: Update workspace_members instead of users table
        await drizzle_1.db
            .update(schema_1.workspaceMembers)
            .set({ teamId: null })
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.workspaceMembers.userId, userId), (0, drizzle_orm_1.eq)(schema_1.workspaceMembers.teamId, teamId)));
        return this.getTeamById(teamId);
    }
    /**
     * Get available users for a team (users in workspace, optionally not in any team)
     */
    async getAvailableUsers(workspaceId) {
        return drizzle_1.db
            .select({
            id: schema_1.users.id,
            name: schema_1.users.name,
            email: schema_1.users.email,
            avatar: schema_1.users.avatar,
        })
            .from(schema_1.workspaceMembers)
            .innerJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.workspaceMembers.userId, schema_1.users.id))
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.workspaceMembers.workspaceId, workspaceId), (0, drizzle_orm_1.eq)(schema_1.users.isActive, true)));
    }
}
exports.TeamService = TeamService;
