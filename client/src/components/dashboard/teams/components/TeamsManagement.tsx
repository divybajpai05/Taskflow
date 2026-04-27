// components/hr/TeamsManagement.tsx
import React, { useCallback, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Pencil,
  Trash2,
  Users,
  UserPlus,
  Search,
  X,
  Loader2,
} from "lucide-react";
import apiClient from "@/api/client";
import { toast } from "sonner";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────
interface TeamMember {
  id: string;
  name: string;
  initials: string;
  email: string;
}

interface Team {
  id: string;
  name: string;
  description: string;
  members: TeamMember[];
  memberCount: number;
  createdAt: string;
  color?: string;
}

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────
export const TeamsManagement: React.FC = () => {
  // ==================== STATE ====================
  const [teams, setTeams] = useState<Team[]>([]);
  const [availableUsers, setAvailableUsers] = useState<TeamMember[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [deletingTeam, setDeletingTeam] = useState<Team | null>(null);
  const [teamForMembers, setTeamForMembers] = useState<Team | null>(null);

  // Form data
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [formErrors, setFormErrors] = useState<{ name?: string }>({});
  const [memberSearchTerm, setMemberSearchTerm] = useState("");

  // ==================== DATA FETCHING ====================
  const fetchTeams = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get("/teams");
      if (response.data.success) setTeams(response.data.data);
    } catch (error) {
      toast.error("Failed to load teams");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchAvailableUsers = useCallback(async () => {
    try {
      const response = await apiClient.get("/teams/available-users");
      if (response.data.success) {
        setAvailableUsers(
          response.data.data.map((u: any) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            initials: u.name
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2),
          })),
        );
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  }, []);

  useEffect(() => {
    fetchTeams();
    fetchAvailableUsers();
  }, [fetchTeams, fetchAvailableUsers]);

  // ==================== FILTERS ====================
  const filteredTeams = teams.filter((team) =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  console.log(filteredTeams)

  // ==================== FORM HELPERS ====================
  const resetForm = () => {
    setFormData({ name: "", description: "" });
    setFormErrors({});
    setEditingTeam(null);
  };

  const validateForm = (): boolean => {
    const errors: { name?: string } = {};
    if (!formData.name.trim()) errors.name = "Team name is required";
    else if (formData.name.trim().length < 2)
      errors.name = "Name must be at least 2 characters";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ==================== CRUD OPERATIONS ====================
  const handleCreateTeam = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const response = await apiClient.post("/teams", {
        name: formData.name.trim(),
        description: formData.description.trim(),
      });

      if (response.data.success) {
        toast.success("Team created successfully!");
        setIsCreateDialogOpen(false);
        resetForm();
        fetchTeams();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to create team");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditTeam = async () => {
    if (!editingTeam || !validateForm()) return;

    setIsSubmitting(true);
    try {
      await apiClient.put(`/teams/${editingTeam.id}`, {
        name: formData.name.trim(),
        description: formData.description.trim(),
      });

      toast.success("Team updated!");
      setEditingTeam(null);
      resetForm();
      fetchTeams();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to update team");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTeam = async () => {
    if (!deletingTeam) return;

    setIsSubmitting(true);
    try {
      await apiClient.delete(`/teams/${deletingTeam.id}`);
      toast.success("Team deleted!");
      setDeletingTeam(null);
      fetchTeams();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to delete team");
      setDeletingTeam(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (team: Team) => {
    setEditingTeam(team);
    setFormData({ name: team.name, description: team.description || "" });
  };

  // ==================== MEMBER MANAGEMENT ====================
  const getAvailableUsers = (team: Team) => {
    if (!team) return [];
    return availableUsers.filter(
      (user) => !team.members.some((m) => m.id === user.id),
    );
  };

  const filteredAvailableUsers = teamForMembers
    ? getAvailableUsers(teamForMembers).filter((user) =>
        user.name.toLowerCase().includes(memberSearchTerm.toLowerCase()),
      )
    : [];

  const handleAddMember = async (user: TeamMember) => {
    if (!teamForMembers) return;

    try {
      await apiClient.post(`/teams/${teamForMembers.id}/members`, {
        userId: user.id,
      });

      toast.success(`${user.name} added to team!`);

      // ✅ Fetch fresh teams list
      const teamsResponse = await apiClient.get("/teams");
      if (teamsResponse.data.success) {
        setTeams(teamsResponse.data.data);

        // ✅ Update the open dialog with fresh data
        const updatedTeam = teamsResponse.data.data.find(
          (t: Team) => t.id === teamForMembers.id,
        );
        if (updatedTeam) {
          setTeamForMembers(updatedTeam);
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to add member");
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!teamForMembers) return;

    try {
      await apiClient.delete(`/teams/${teamForMembers.id}/members/${memberId}`);

      toast.success("Member removed from team!");

      // ✅ Fetch fresh teams list
      const teamsResponse = await apiClient.get("/teams");
      if (teamsResponse.data.success) {
        setTeams(teamsResponse.data.data);

        // ✅ Update the open dialog with fresh data
        const updatedTeam = teamsResponse.data.data.find(
          (t: Team) => t.id === teamForMembers.id,
        );
        if (updatedTeam) {
          setTeamForMembers(updatedTeam);
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to remove member");
    }
  };

  // ==================== RENDER ====================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Teams management
          </h1>
          <p className="text-muted-foreground mt-1">
            Create teams, manage members and organize your workforce
          </p>
        </div>
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          size="lg"
          className="cursor-pointer"
        >
          <Plus className="mr-2 h-5 w-5" />
          Create New Team
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search teams..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Teams Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredTeams.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">
            {searchTerm ? "No teams match your search" : "No teams yet"}
          </p>
          <p className="text-muted-foreground">
            {searchTerm
              ? "Try a different search term"
              : "Create your first team to get started"}
          </p>
        </div>
      ) : (
        <ScrollArea className="h-[calc(100vh-240px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
            {filteredTeams.map((team) => (
              <Card
                key={team.id}
                className="hover:shadow-md transition-all group"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-xl">{team.name}</CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {team.memberCount || team.members?.length || 0} members
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {team.description || "No description"}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Member avatars */}
                  {team.members && team.members.length > 0 && (
                    <div className="flex -space-x-3">
                      {team.members.slice(0, 5).map((member) => (
                        <div
                          key={member.id}
                          className="w-8 h-8 rounded-full bg-primary/10 border-2 border-background flex items-center justify-center text-xs font-semibold ring-2 ring-background"
                        >
                          {member.initials}
                        </div>
                      ))}
                      {team.members.length > 5 && (
                        <div className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium">
                          +{team.members.length - 5}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTeamForMembers(team);
                      }}
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Manage Members
                    </Button>

                    <Button
                      className="cursor-pointer"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEdit(team);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingTeam(team);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <ScrollBar orientation="vertical" />
        </ScrollArea>
      )}

      {/* ====================== CREATE / EDIT DIALOG ====================== */}
      <Dialog
        open={isCreateDialogOpen || !!editingTeam}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            setEditingTeam(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingTeam ? "Edit Team" : "Create New Team"}
            </DialogTitle>
            <DialogDescription>
              {editingTeam
                ? "Update team details below."
                : "Create a new team and start adding members later."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Team Name*</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (formErrors.name) setFormErrors({});
                }}
                placeholder="e.g. Product Design"
                disabled={isSubmitting}
                className={formErrors.name ? "border-red-500" : ""}
                autoFocus
              />
              {formErrors.name && (
                <p className="text-xs text-red-500">{formErrors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="What does this team do?"
                rows={3}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                setEditingTeam(null);
                resetForm();
              }}
              className="cursor-pointer"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              className="cursor-pointer"
              onClick={editingTeam ? handleEditTeam : handleCreateTeam}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : editingTeam ? (
                "Save Changes"
              ) : (
                "Create Team"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ====================== DELETE CONFIRMATION ====================== */}
      <AlertDialog
        open={!!deletingTeam}
        onOpenChange={() => setDeletingTeam(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Team</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>{deletingTeam?.name}</strong>? This action cannot be
              undone and all members will be removed from this team.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTeam}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Team"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ====================== MANAGE MEMBERS DIALOG ====================== */}
      <Dialog
        open={!!teamForMembers}
        onOpenChange={() => setTeamForMembers(null)}
      >
        <DialogContent className="max-w-2xl flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {teamForMembers?.name}
            </DialogTitle>
            <DialogDescription>
              {teamForMembers?.members?.length || 0} members • Manage team
              membership
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[70vh]">
            <div className="space-y-8 py-4 pr-4">
              {/* Current Members */}
              <div>
                <h3 className="font-medium mb-3 text-sm uppercase tracking-widest">
                  Current Members
                </h3>
                <div className="space-y-3">
                  {teamForMembers?.members?.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      No members yet
                    </p>
                  ) : (
                    teamForMembers?.members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between bg-muted/50 rounded-lg p-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold">
                            {member.initials}
                          </div>
                          <div>
                            <p className="font-medium">{member.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {member.email}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive cursor-pointer"
                          onClick={() => handleRemoveMember(member.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Add Members */}
              <div>
                <h3 className="font-medium mb-3 text-sm uppercase tracking-widest">
                  Add Members
                </h3>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search employees..."
                    value={memberSearchTerm}
                    onChange={(e) => setMemberSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="max-h-64 overflow-auto space-y-2 pr-2">
                  {filteredAvailableUsers.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-6 text-center">
                      No more employees available to add
                    </p>
                  ) : (
                    filteredAvailableUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center gap-3 p-3 hover:bg-accent rounded-lg cursor-pointer transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold">
                          {user.initials}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{user.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="cursor-pointer"
                          onClick={() => handleAddMember(user)}
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
            <ScrollBar orientation="vertical" />
          </ScrollArea>

          <DialogFooter className="flex-shrink-0 border-t pt-4">
            <Button
              className="cursor-pointer"
              variant="outline"
              onClick={() => setTeamForMembers(null)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
