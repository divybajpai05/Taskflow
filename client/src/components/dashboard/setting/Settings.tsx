// components/dashboard/setting/Settings.tsx
import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  User,
  Mail,
  Phone,
  Building2,
  Shield,
  Key,
  Camera,
  LogOut,
  Loader2,
  CheckCircle2,
  FileText,
  Clock,
  Check,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import apiClient from "@/api/client";
import { useAuthStore } from "@/stores";
import LeaveRequest from "../leave_management/LeaveRequest";

export default function Settings() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  // ==================== STATE ====================
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSavingPhone, setIsSavingPhone] = useState(false);
  const [phone, setPhone] = useState(user?.phone || "");
  const [phoneError, setPhoneError] = useState("");
  const [switchingWorkspace, setSwitchingWorkspace] = useState<string | null>(
    null,
  );

  // Workspace data
  const workspaces = user?.workspaces || [];
  const currentWorkspaceId = user?.activeWorkspaceId;

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>(
    {},
  );
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

  // ==================== SYNC PHONE FROM USER ====================
  useEffect(() => {
    if (user?.phone) {
      setPhone(user.phone);
    }
  }, [user?.phone]);

  // ==================== WORKSPACE SWITCH ====================

  const handleSwitchWorkspace = async (
    workspaceId: string,
    workspaceName: string,
  ) => {
    if (workspaceId === currentWorkspaceId) {
      toast.info("You are already in this workspace");
      return;
    }

    console.log("got clicked")

    setSwitchingWorkspace(workspaceId);
    try {
      const response = await apiClient.post(
        `/workspaces/${workspaceId}/switch`,
      );

      console.log(response);

      if (response.data.success) {
        const { id, name, accessToken, permissions, role } = response.data.data;

        // ✅ Update store with new token (which has correct workspaceId)
        if (user) {
          useAuthStore.getState().setAuth(
            {
              ...user,
              activeWorkspaceId: id,
              activeWorkspaceName: name,
              role: role,
              permissions: permissions,
            },
            accessToken,
          );
        }

        toast.success(`Switched to "${name}"`, {
          description: "Redirecting to dashboard...",
        });

        setTimeout(() => navigate("/dashboard"), 500);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to switch workspace");
    } finally {
      setSwitchingWorkspace(null);
    }
  };

  // ==================== PHONE UPDATE ====================
  const handleUpdatePhone = async () => {
    if (!phone.trim()) {
      setPhoneError("Phone number is required");
      return;
    }

    const phoneRegex = /^\+?[\d\s-]{10,15}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ""))) {
      setPhoneError("Please enter a valid phone number");
      return;
    }

    setIsSavingPhone(true);
    setPhoneError("");
    try {
      await apiClient.put(`/users/${user?.id}`, { phone: phone.trim() });
      toast.success("Phone number updated!");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to update phone");
    } finally {
      setIsSavingPhone(false);
    }
  };

  // ==================== PASSWORD CHANGE ====================
  const validatePasswordForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!passwordForm.currentPassword) {
      errors.currentPassword = "Current password is required";
    }

    if (!passwordForm.newPassword) {
      errors.newPassword = "New password is required";
    } else if (passwordForm.newPassword.length < 8) {
      errors.newPassword = "Must be at least 8 characters";
    } else if (!/[A-Z]/.test(passwordForm.newPassword)) {
      errors.newPassword = "Must contain an uppercase letter";
    } else if (!/[a-z]/.test(passwordForm.newPassword)) {
      errors.newPassword = "Must contain a lowercase letter";
    } else if (!/[0-9]/.test(passwordForm.newPassword)) {
      errors.newPassword = "Must contain a number";
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validatePasswordForm()) return;

    setIsChangingPassword(true);
    try {
      await apiClient.put(`/users/${user?.id}/password`, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      toast.success("Password changed successfully!");
      setIsPasswordDialogOpen(false);
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordErrors({});
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to change password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  // ==================== HELPERS ====================
  const getAvatarColor = () => {
    const role = user?.role;
    if (role === "Admin") return "bg-red-500";
    if (role === "HR") return "bg-purple-500";
    if (role === "Manager") return "bg-blue-500";
    return "bg-green-500";
  };

  const getRoleColor = () => {
    const role = user?.role;
    if (role === "Admin")
      return "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300";
    if (role === "HR")
      return "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300";
    if (role === "Manager")
      return "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300";
    return "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300";
  };

  return (
    <div className="space-y-6 p-6 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      {/* ==================== PROFILE CARD ==================== */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Information
          </CardTitle>
          <CardDescription>
            Your personal information and account details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-6">
            <div className="relative group">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user?.avatar || undefined} />
                <AvatarFallback
                  className={`${getAvatarColor()} text-white text-2xl font-semibold`}
                >
                  {user?.avatarInitials || user?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <Button
                size="icon"
                variant="outline"
                className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                title="Change avatar (coming soon)"
                disabled
              >
                <Camera className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div>
              <h3 className="text-lg font-semibold">{user?.name || "User"}</h3>
              <p className="text-sm text-muted-foreground">
                Avatar upload coming soon
              </p>
            </div>
          </div>

          <Separator />

          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />
                Full Name
              </Label>
              <Input
                value={user?.name || ""}
                disabled
                className="bg-muted/50"
              />
              <p className="text-xs text-muted-foreground">Cannot be changed</p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                Email Address
              </Label>
              <Input
                value={user?.email || ""}
                disabled
                className="bg-muted/50"
              />
              <p className="text-xs text-muted-foreground">Cannot be changed</p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                Phone Number
              </Label>
              <div className="flex gap-2">
                <Input
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setPhoneError("");
                  }}
                  placeholder="+91 9876543210"
                  className={phoneError ? "border-red-500" : ""}
                />
                <Button
                  onClick={handleUpdatePhone}
                  disabled={isSavingPhone}
                  size="sm"
                  className="cursor-pointer"
                >
                  {isSavingPhone ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Save"
                  )}
                </Button>
              </div>
              {phoneError && (
                <p className="text-xs text-red-500">{phoneError}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="h-4 w-4" />
                Team
              </Label>
              <Input
                value={user?.team || "Not assigned"}
                disabled
                className="bg-muted/50"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <Shield className="h-4 w-4" />
                Role
              </Label>
              <div className="flex items-center gap-2">
                <Badge className={getRoleColor()}>{user?.role || "N/A"}</Badge>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle2 className="h-4 w-4" />
                Account Status
              </Label>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Active
                </Badge>
                {user?.emailVerified && (
                  <Badge variant="outline" className="text-xs">
                    Email Verified
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ==================== WORKSPACES CARD ==================== */}
      {workspaces.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Your Workspaces
            </CardTitle>
            <CardDescription>
              You are a member of {workspaces.length} workspaces. Click to
              switch.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {workspaces.map((ws) => {
                const isActive = ws.workspaceId === currentWorkspaceId;
                const isSwitching = switchingWorkspace === ws.workspaceId;

                return (
                  <div
                    key={ws.workspaceId}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                      isActive
                        ? "border-primary bg-primary/5 dark:bg-primary/10"
                        : "border-border hover:bg-accent/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium flex items-center gap-2">
                          {ws.workspaceName}
                          {isActive && (
                            <Badge className="bg-primary/10 text-primary text-xs gap-1">
                              <Check className="h-3 w-3" />
                              Current
                            </Badge>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Role: {ws.roleName}
                        </p>
                      </div>
                    </div>

                    {!isActive && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleSwitchWorkspace(
                            ws.workspaceId,
                            ws.workspaceName,
                          )
                        }
                        disabled={isSwitching}
                        className="gap-1 cursor-pointer"
                      >
                        {isSwitching ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ArrowRight className="h-4 w-4" />
                        )}
                        Switch
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ==================== SECURITY CARD ==================== */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Security
          </CardTitle>
          <CardDescription>
            Manage your password and account security
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Password</p>
              <p className="text-sm text-muted-foreground">
                Change your login password regularly
              </p>
            </div>
            <Dialog
              open={isPasswordDialogOpen}
              onOpenChange={setIsPasswordDialogOpen}
            >
              <DialogTrigger asChild>
                <Button variant="outline" className="cursor-pointer gap-2">
                  <Key className="h-4 w-4" />
                  Change Password
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Change Password</DialogTitle>
                  <DialogDescription>
                    Enter your current password and a new password
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Current Password*</Label>
                    <Input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => {
                        setPasswordForm({
                          ...passwordForm,
                          currentPassword: e.target.value,
                        });
                        if (passwordErrors.currentPassword)
                          setPasswordErrors({});
                      }}
                      className={
                        passwordErrors.currentPassword ? "border-red-500" : ""
                      }
                      placeholder="••••••••"
                    />
                    {passwordErrors.currentPassword && (
                      <p className="text-xs text-red-500">
                        {passwordErrors.currentPassword}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>New Password*</Label>
                    <Input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => {
                        setPasswordForm({
                          ...passwordForm,
                          newPassword: e.target.value,
                        });
                        if (passwordErrors.newPassword) setPasswordErrors({});
                      }}
                      className={
                        passwordErrors.newPassword ? "border-red-500" : ""
                      }
                      placeholder="••••••••"
                    />
                    {passwordErrors.newPassword && (
                      <p className="text-xs text-red-500">
                        {passwordErrors.newPassword}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Confirm New Password*</Label>
                    <Input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => {
                        setPasswordForm({
                          ...passwordForm,
                          confirmPassword: e.target.value,
                        });
                        if (passwordErrors.confirmPassword)
                          setPasswordErrors({});
                      }}
                      className={
                        passwordErrors.confirmPassword ? "border-red-500" : ""
                      }
                      placeholder="••••••••"
                    />
                    {passwordErrors.confirmPassword && (
                      <p className="text-xs text-red-500">
                        {passwordErrors.confirmPassword}
                      </p>
                    )}
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">
                      Password must be at least 8 characters with uppercase,
                      lowercase, and number.
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsPasswordDialogOpen(false)}
                    disabled={isChangingPassword}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleChangePassword}
                    disabled={isChangingPassword}
                  >
                    {isChangingPassword ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    {isChangingPassword ? "Changing..." : "Change Password"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <Separator />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>
              Last login:{" "}
              {user?.lastLoginAt
                ? new Date(user.lastLoginAt).toLocaleString()
                : "Unknown"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* ==================== LEAVE REQUEST CARD ==================== */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Leave Request
          </CardTitle>
          <CardDescription>
            Apply for vacation, sick leave, or other time off
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LeaveRequest />
        </CardContent>
      </Card>

      {/* ==================== DANGER ZONE ==================== */}
      <Card className="border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle className="text-red-600 flex items-center gap-2">
            <LogOut className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Account actions that cannot be undone
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={async () => {
              await logout();
              toast.success("Logged out successfully");
              window.location.href = "/";
            }}
            className="cursor-pointer"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
