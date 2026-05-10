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
  async getWorkspaceTeams(
    workspaceId: string,
    userId: string,
    userPermissions: string[],
    search?: string,
  ) {
    const canSeeAllTeams =
      userPermissions.includes("user_management") ||
      userPermissions.includes("hr_dashboard");

    // ✅ Build conditions array instead of reassigning query
    const conditions: any[] = [eq(teams.workspaceId, workspaceId)];

    if (search) {
      conditions.push(like(teams.name, `%${search}%`));
    }

    if (!canSeeAllTeams) {
      // Only user's own team
      const [userMember] = await db
        .select({ teamId: workspaceMembers.teamId })
        .from(workspaceMembers)
        .where(
          and(
            eq(workspaceMembers.userId, userId),
            eq(workspaceMembers.workspaceId, workspaceId),
          ),
        )
        .limit(1);

      if (!userMember?.teamId) {
        return [];
      }

      conditions.push(eq(teams.id, userMember.teamId));
    }

    // ✅ Single query with all conditions
    const teamList = await db
      .select({
        id: teams.id,
        name: teams.name,
        description: teams.description,
        color: teams.color,
        workspaceId: teams.workspaceId,
      })
      .from(teams)
      .where(and(...conditions));

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
          .from(workspaceMembers)
          .innerJoin(users, eq(workspaceMembers.userId, users.id))
          .where(
            and(
              eq(workspaceMembers.teamId, team.id),
              eq(workspaceMembers.workspaceId, workspaceId),
            ),
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

    // FIXED: Get members from workspace_members
    const members = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        avatar: users.avatar,
      })
      .from(workspaceMembers)
      .innerJoin(users, eq(workspaceMembers.userId, users.id))
      .where(eq(workspaceMembers.teamId, team.id));

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
    const [existing] = await db
      .select()
      .from(teams)
      .where(and(eq(teams.name, name), eq(teams.workspaceId, workspaceId)))
      .limit(1);

    if (existing) {
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

    // FIXED: Remove team from workspace_members (not users table)
    await db
      .update(workspaceMembers)
      .set({ teamId: null })
      .where(eq(workspaceMembers.teamId, teamId));

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

    // FIXED: Update workspace_members instead of users table
    // Check if user is already in workspace_members for this workspace
    const [existingMember] = await db
      .select()
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.userId, userId),
          eq(workspaceMembers.workspaceId, team.workspaceId),
        ),
      )
      .limit(1);

    if (existingMember) {
      await db
        .update(workspaceMembers)
        .set({ teamId: team.id })
        .where(
          and(
            eq(workspaceMembers.userId, userId),
            eq(workspaceMembers.workspaceId, team.workspaceId),
          ),
        );
    } else {
      // Add to workspace_members with this team
      await db.insert(workspaceMembers).values({
        id: uuidv4(),
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
  async removeTeamMember(teamId: string, userId: string) {
    // FIXED: Update workspace_members instead of users table
    await db
      .update(workspaceMembers)
      .set({ teamId: null })
      .where(
        and(
          eq(workspaceMembers.userId, userId),
          eq(workspaceMembers.teamId, teamId),
        ),
      );

    return this.getTeamById(teamId);
  }

  /**
   * Get available users for a team (users in workspace, optionally not in any team)
   */
  async getAvailableUsers(workspaceId: string) {
    return db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        avatar: users.avatar,
      })
      .from(workspaceMembers)
      .innerJoin(users, eq(workspaceMembers.userId, users.id))
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(users.isActive, true),
        ),
      );
  }
}
