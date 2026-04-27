// src/modules/teams/team.service.ts
import { db } from "../../db/drizzle";
import { teams, users, workspaceMembers } from "../../db/schema";
import { eq, and, like } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export interface CreateTeamInput {
  name: string;
  description?: string;
  color?: string;
}

export interface UpdateTeamInput {
  name?: string;
  description?: string;
  color?: string;
}

export class TeamService {
  /**
   * Get all teams in a workspace with member counts
   */
  async getWorkspaceTeams(workspaceId: string, search?: string) {
    const teamList = await db
      .select({
        id: teams.id,
        name: teams.name,
        description: teams.description,
        color: teams.color,
        workspaceId: teams.workspaceId,
      })
      .from(teams)
      .where(
        search
          ? and(
              eq(teams.workspaceId, workspaceId),
              like(teams.name, `%${search}%`),
            )
          : eq(teams.workspaceId, workspaceId),
      );

    // Get members for each team
    const teamsWithMembers = await Promise.all(
      teamList.map(async (team) => {
        const members = await db
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
            avatar: users.avatar,
          })
          .from(users)
          .where(
            and(eq(users.teamId, team.id), eq(users.workspaceId, workspaceId)),
          );

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
      }),
    );

    return teamsWithMembers;
  }

  /**
   * Get a single team by ID
   */
  async getTeamById(teamId: string) {
    const [team] = await db
      .select()
      .from(teams)
      .where(eq(teams.id, teamId))
      .limit(1);

    if (!team) throw new Error("Team not found");

    const members = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        avatar: users.avatar,
      })
      .from(users)
      .where(eq(users.teamId, team.id));

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
  async createTeam(input: CreateTeamInput, workspaceId: string) {
    const { name, description, color } = input;

    // Check if team name already exists in workspace
    const existing = await db
      .select()
      .from(teams)
      .where(and(eq(teams.name, name), eq(teams.workspaceId, workspaceId)))
      .limit(1);

    if (existing.length > 0) {
      throw new Error("A team with this name already exists in this workspace");
    }

    const teamId = uuidv4();

    await db.insert(teams).values({
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
  async updateTeam(teamId: string, input: UpdateTeamInput) {
    const [team] = await db
      .select()
      .from(teams)
      .where(eq(teams.id, teamId))
      .limit(1);

    if (!team) throw new Error("Team not found");

    const updateData: any = {};
    if (input.name) updateData.name = input.name;
    if (input.description !== undefined)
      updateData.description = input.description;
    if (input.color) updateData.color = input.color;

    await db.update(teams).set(updateData).where(eq(teams.id, teamId));

    return this.getTeamById(teamId);
  }

  /**
   * Delete a team
   */
  async deleteTeam(teamId: string) {
    const [team] = await db
      .select()
      .from(teams)
      .where(eq(teams.id, teamId))
      .limit(1);

    if (!team) throw new Error("Team not found");

    // Remove team from users
    await db
      .update(users)
      .set({ teamId: null, team: null })
      .where(eq(users.teamId, teamId));

    // Delete the team
    await db.delete(teams).where(eq(teams.id, teamId));

    return { success: true, message: "Team deleted successfully" };
  }

  /**
   * Add a member to a team
   */
  async addTeamMember(teamId: string, userId: string) {
    const [team] = await db
      .select()
      .from(teams)
      .where(eq(teams.id, teamId))
      .limit(1);

    if (!team) throw new Error("Team not found");

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) throw new Error("User not found");

    await db
      .update(users)
      .set({ teamId: team.id, team: team.name })
      .where(eq(users.id, userId));

    return this.getTeamById(teamId);
  }

  /**
   * Remove a member from a team
   */
  async removeTeamMember(teamId: string, userId: string) {
    await db
      .update(users)
      .set({ teamId: null, team: null })
      .where(and(eq(users.id, userId), eq(users.teamId, teamId)));

    return this.getTeamById(teamId);
  }

  /**
   * Get available users for a team (users not in any team)
   */
  async getAvailableUsers(workspaceId: string) {
    return db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        avatar: users.avatar,
      })
      .from(users)
      .innerJoin(workspaceMembers, eq(users.id, workspaceMembers.userId))
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(users.isActive, true),
        ),
      );
  }
}
