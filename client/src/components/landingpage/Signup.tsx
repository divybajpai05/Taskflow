// src/components/landingpage/signup.tsx
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Field, FieldGroup } from "../ui/field";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import apiClient from "../../api/client";

interface SignupProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSigninClick?: () => void;
  onSuccess?: (data: any) => void;
}

interface FormData {
  workspaceName: string;
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  workspaceName?: string;
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

export default function Signup({
  open,
  onOpenChange,
  onSigninClick,
  onSuccess,
}: SignupProps) {
  const [formData, setFormData] = useState<FormData>({
    workspaceName: "",
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSigninClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onSigninClick) {
      onSigninClick();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.workspaceName.trim()) {
      newErrors.workspaceName = "Workspace name is required";
    } else if (formData.workspaceName.length < 2) {
      newErrors.workspaceName = "Workspace name must be at least 2 characters";
    }

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    } else if (formData.fullName.length < 2) {
      newErrors.fullName = "Full name must be at least 2 characters";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // ✅ Match backend password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (!/[A-Z]/.test(formData.password)) {
      newErrors.password =
        "Password must contain at least one uppercase letter";
    } else if (!/[a-z]/.test(formData.password)) {
      newErrors.password =
        "Password must contain at least one lowercase letter";
    } else if (!/[0-9]/.test(formData.password)) {
      newErrors.password = "Password must contain at least one number";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const parseBackendError = (error: any): FormErrors => {
    const newErrors: FormErrors = {};

    const responseData = error.response?.data;

    console.log("📝 Parsing backend error:", responseData);

    // Check for Zod validation error format
    if (responseData?.error === "Validation failed" && responseData?.details) {
      const details = responseData.details;

      if (Array.isArray(details)) {
        console.log("📝 Validation details:", details);
        details.forEach((issue: any) => {
          const field = issue.field || issue.path?.[0];
          const message = issue.message;

          console.log(`📝 Field: ${field}, Message: ${message}`);

          if (field === "email") {
            newErrors.email = message;
          } else if (field === "password") {
            newErrors.password = message;
          } else if (field === "name") {
            newErrors.fullName = message;
          } else if (field === "workspaceName") {
            newErrors.workspaceName = message;
          } else if (field === "confirmPassword") {
            newErrors.confirmPassword = message;
          }
        });
      }
    }

    // Check for specific error messages
    const errorMessage = responseData?.error || "";

    if (errorMessage.includes("email already exists")) {
      newErrors.email = "This email is already registered";
    } else if (errorMessage.includes("Workspace name is already taken")) {
      newErrors.workspaceName = "This workspace name is already taken";
    } else if (errorMessage.includes("User with this email already exists")) {
      newErrors.email = "This email is already registered";
    }

    // If no specific field errors, set general error
    if (Object.keys(newErrors).length === 0) {
      newErrors.general =
        errorMessage || "Registration failed. Please try again.";
    }

    console.log("📝 Parsed errors:", newErrors);
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ Run frontend validation first
    if (!validateForm()) {
      console.log("📝 Frontend validation failed:", errors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    const loadingToastId = toast.loading("Creating your workspace...");

    try {
      const payload = {
        workspaceName: formData.workspaceName,
        name: formData.fullName,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      };

      console.log("📝 Sending payload:", payload);

      const response = await apiClient.post("/auth/register", payload);

      if (response.data.success) {
        toast.dismiss(loadingToastId);

        toast.success("🎉 Workspace created successfully!", {
          description: "Please check your email to verify your account.",
          duration: 8000,
          action: {
            label: "Got it",
            onClick: () => toast.dismiss(),
          },
        });

        localStorage.setItem("authToken", response.data.data.accessToken);
        localStorage.setItem("user", JSON.stringify(response.data.data.user));

        if (onSuccess) {
          onSuccess(response.data.data);
        }

        if (onOpenChange) {
          onOpenChange(false);
        }

        setFormData({
          workspaceName: "",
          fullName: "",
          email: "",
          password: "",
          confirmPassword: "",
        });
      }
    } catch (error: any) {
      toast.dismiss(loadingToastId);

      console.error("Registration error:", error);

      // ✅ Parse backend errors
      const parsedErrors = parseBackendError(error);
      setErrors(parsedErrors);

      // Show specific error message in toast
      let toastMessage = "Registration failed. Please try again.";

      if (parsedErrors.email) {
        toastMessage = parsedErrors.email;
      } else if (parsedErrors.workspaceName) {
        toastMessage = parsedErrors.workspaceName;
      } else if (parsedErrors.password) {
        toastMessage = parsedErrors.password;
      } else if (parsedErrors.general) {
        toastMessage = parsedErrors.general;
      }

      toast.error("Registration failed", {
        description: toastMessage,
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setFormData({
        workspaceName: "",
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
      setErrors({});
    }
    if (onOpenChange) {
      onOpenChange(newOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-lg">Create workspace</DialogTitle>
            <DialogDescription>
              Create your personal workspace and manage team and task
              efficiently.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup>
            <Field>
              <Label htmlFor="workspace-name">Workspace Name*</Label>
              <Input
                id="workspace-name"
                name="workspaceName"
                value={formData.workspaceName}
                onChange={handleChange}
                required
                disabled={isLoading}
                className={errors.workspaceName ? "border-red-500" : ""}
              />
              {errors.workspaceName && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.workspaceName}
                </p>
              )}
            </Field>

            <Field>
              <Label htmlFor="fullName">Your full name*</Label>
              <Input
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                disabled={isLoading}
                className={errors.fullName ? "border-red-500" : ""}
              />
              {errors.fullName && (
                <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>
              )}
            </Field>

            <Field>
              <Label htmlFor="email">Email*</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={isLoading}
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && (
                <p className="text-xs text-red-500 mt-1">{errors.email}</p>
              )}
            </Field>

            <Field>
              <Label htmlFor="password">Password*</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={isLoading}
                className={errors.password ? "border-red-500" : ""}
              />
              {errors.password && (
                <p className="text-xs text-red-500 mt-1">{errors.password}</p>
              )}
              {/* ✅ Show password requirements hint */}
              <p className="text-xs text-gray-500 mt-1">
                Min 8 chars, uppercase, lowercase, and number
              </p>
            </Field>

            <Field>
              <Label htmlFor="confirm-password">Confirm password*</Label>
              <Input
                id="confirm-password"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                disabled={isLoading}
                className={errors.confirmPassword ? "border-red-500" : ""}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.confirmPassword}
                </p>
              )}
            </Field>
          </FieldGroup>

          <DialogFooter>
            <DialogClose asChild>
              <Button
                variant="outline"
                className="cursor-pointer"
                type="button"
                disabled={isLoading}
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              className="cursor-pointer"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span>
                  Creating...
                </span>
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>

          <div className="flex flex-row items-center justify-center mt-4">
            <p className="text-sm text-gray-600">Already have a workspace?</p>
            <Button
              variant="link"
              className="underline text-xs cursor-pointer"
              onClick={handleSigninClick}
              type="button"
            >
              Sign in
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
