// components/hr/TeamsManagement.tsx
import React, { useState } from "react";
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
import { Plus, Pencil, Trash2, Users, UserPlus, Search, X } from "lucide-react";

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
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────────────────────
const INITIAL_TEAMS: Team[] = [
  {
    id: "1",
    name: "Engineering",
    description: "Software development, backend, frontend & DevOps",
    members: [
      {
        id: "u1",
        name: "Alice Chen",
        initials: "AC",
        email: "alice@taskflow.com",
      },
      {
        id: "u2",
        name: "Bob Smith",
        initials: "BS",
        email: "bob@taskflow.com",
      },
      {
        id: "u3",
        name: "Carol Williams",
        initials: "CW",
        email: "carol@taskflow.com",
      },
    ],
    createdAt: "2026-03-15",
  },
  {
    id: "2",
    name: "Marketing",
    description: "Brand strategy, content & digital campaigns",
    members: [
      {
        id: "u4",
        name: "David Lee",
        initials: "DL",
        email: "david@taskflow.com",
      },
      {
        id: "u5",
        name: "Emma Davis",
        initials: "ED",
        email: "emma@taskflow.com",
      },
    ],
    createdAt: "2026-02-28",
  },
  {
    id: "3",
    name: "HR & People",
    description: "Talent acquisition, culture & employee experience",
    members: [
      {
        id: "u6",
        name: "Prashant Thakur",
        initials: "PT",
        email: "prashant@taskflow.com",
      },
      {
        id: "u7",
        name: "Fatima Khan",
        initials: "FK",
        email: "fatima@taskflow.com",
      },
    ],
    createdAt: "2026-04-01",
  },
];

const MOCK_AVAILABLE_USERS: TeamMember[] = [
  {
    id: "u8",
    name: "Rahul Sharma",
    initials: "RS",
    email: "rahul@taskflow.com",
  },
  { id: "u9", name: "Neha Gupta", initials: "NG", email: "neha@taskflow.com" },
  {
    id: "u10",
    name: "Vikram Rao",
    initials: "VR",
    email: "vikram@taskflow.com",
  },
  {
    id: "u11",
    name: "Priya Patel",
    initials: "PP",
    email: "priya@taskflow.com",
  },
  {
    id: "u12",
    name: "Arjun Singh",
    initials: "AS",
    email: "arjun@taskflow.com",
  },
];

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────
export const TeamsManagement: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>(INITIAL_TEAMS);
  const [searchTerm, setSearchTerm] = useState("");

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [deletingTeam, setDeletingTeam] = useState<Team | null>(null);
  const [teamForMembers, setTeamForMembers] = useState<Team | null>(null);

  // Form data
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  // Member management helpers
  const [memberSearchTerm, setMemberSearchTerm] = useState("");

  const filteredTeams = teams.filter((team) =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const resetForm = () => {
    setFormData({ name: "", description: "" });
    setEditingTeam(null);
  };

  const handleCreateTeam = () => {
    if (!formData.name.trim()) return alert("Team name is required");

    const newTeam: Team = {
      id: `team-${Date.now()}`,
      name: formData.name,
      description: formData.description,
      members: [],
      createdAt: new Date().toISOString().split("T")[0],
    };

    setTeams((prev) => [...prev, newTeam]);
    setIsCreateDialogOpen(false);
    resetForm();
  };

  const handleEditTeam = () => {
    if (!editingTeam || !formData.name.trim()) return;

    setTeams((prev) =>
      prev.map((t) =>
        t.id === editingTeam.id
          ? { ...t, name: formData.name, description: formData.description }
          : t,
      ),
    );

    setEditingTeam(null);
    resetForm();
  };

  const handleDeleteTeam = () => {
    if (!deletingTeam) return;
    setTeams((prev) => prev.filter((t) => t.id !== deletingTeam.id));
    setDeletingTeam(null);
  };

  const handleOpenEdit = (team: Team) => {
    setEditingTeam(team);
    setFormData({ name: team.name, description: team.description });
  };

  // Member management
  const getAvailableUsers = (team: Team) => {
    return MOCK_AVAILABLE_USERS.filter(
      (user) => !team.members.some((m) => m.id === user.id),
    );
  };

  const filteredAvailableUsers = teamForMembers
    ? getAvailableUsers(teamForMembers).filter((user) =>
        user.name.toLowerCase().includes(memberSearchTerm.toLowerCase()),
      )
    : [];

  const handleAddMember = (user: TeamMember) => {
    if (!teamForMembers) return;

    setTeams((prev) =>
      prev.map((team) =>
        team.id === teamForMembers.id
          ? { ...team, members: [...team.members, user] }
          : team,
      ),
    );

    // Update the currently open dialog team
    setTeamForMembers((prev) =>
      prev ? { ...prev, members: [...prev.members, user] } : null,
    );
  };

  const handleRemoveMember = (memberId: string) => {
    if (!teamForMembers) return;

    setTeams((prev) =>
      prev.map((team) =>
        team.id === teamForMembers.id
          ? {
              ...team,
              members: team.members.filter((m) => m.id !== memberId),
            }
          : team,
      ),
    );

    setTeamForMembers((prev) =>
      prev
        ? {
            ...prev,
            members: prev.members.filter((m) => m.id !== memberId),
          }
        : null,
    );
  };

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
        <Button onClick={() => setIsCreateDialogOpen(true)} size="lg" className="cursor-pointer">
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
      <ScrollArea className="h-[calc(100vh-240px)]">
        {filteredTeams.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No teams found</p>
            <p className="text-muted-foreground">
              Try a different search term or create a new team
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
            {filteredTeams.map((team) => (
              <Card
                key={team.id}
                className="hover:shadow-md transition-all cursor-pointer group"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-xl">{team.name}</CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {team.members.length} members
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {team.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Member avatars */}
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
        )}
        <ScrollBar orientation="vertical" />
      </ScrollArea>

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
              <Label htmlFor="name">Team Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g. Product Design"
              />
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
            >
              Cancel
            </Button>
            <Button className="cursor-pointer" onClick={editingTeam ? handleEditTeam : handleCreateTeam}>
              {editingTeam ? "Save Changes" : "Create Team"}
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
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTeam}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Team
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
              {teamForMembers?.members.length} members • Manage team membership
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
                  {teamForMembers?.members.map((member) => (
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
                  ))}
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
                        onClick={() => handleAddMember(user)}
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
                        <Button size="sm" variant="outline" className="cursor-pointer">
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
            <Button className="cursor-pointer" variant="outline" onClick={() => setTeamForMembers(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
