// src/components/landingpage/signin.tsx
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
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores";

interface SigninProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSignupClick?: () => void;
  onSuccess?: (data: any) => void;
}

interface FormData {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

export default function Signin({
  open,
  onOpenChange,
  onSignupClick,
  onSuccess,
}: SigninProps) {
  const navigate = useNavigate();

  const { setAuth, setLoading } = useAuthStore();
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSignupClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onSignupClick) {
      onSignupClick();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setLoading(true);
    setErrors({});

    const loadingToastId = toast.loading("Signing in...");

    try {
      const response = await apiClient.post("/auth/login", formData);

      console.log("🔵 Login response:", response.data);

      if (response.data.success) {
        toast.dismiss(loadingToastId);

        const { user, accessToken } = response.data.data;

        // ✅ Store in Zustand
        setAuth(user, accessToken);

        console.log("🔵 Store after setAuth:", useAuthStore.getState());


        toast.success("🎉 Welcome back!", {
          description: `Signed in as ${response.data.data.user.name}`,
          duration: 3000,
        });

        if (onSuccess) {
          onSuccess(response.data.data);
        }

        if (onOpenChange) {
          onOpenChange(false);
        }

        // Reset form
        setFormData({
          email: "",
          password: "",
        });

        navigate("/dashboard");
      }
    } catch (error: any) {
      toast.dismiss(loadingToastId);

      console.error("Login error:", error);

      const responseData = error.response?.data;
      const errorMessage =
        responseData?.error || "Login failed. Please try again.";

      // Handle specific error cases
      if (errorMessage.includes("verify your email")) {
        setErrors({
          general:
            "Please verify your email before logging in. Check your inbox for the verification link.",
        });
        toast.error("Email not verified", {
          description: "Please check your inbox and verify your email first.",
          duration: 6000,
          action: {
            label: "Resend",
            onClick: () => handleResendVerification(),
          },
        });
      } else if (errorMessage.includes("Invalid email or password")) {
        setErrors({
          general: "Invalid email or password",
        });
        toast.error("Login failed", {
          description: "Invalid email or password",
        });
      } else if (errorMessage.includes("Account is deactivated")) {
        setErrors({
          general: "Your account has been deactivated. Please contact support.",
        });
        toast.error("Account deactivated", {
          description: "Please contact your administrator.",
        });
      } else {
        setErrors({ general: errorMessage });
        toast.error("Login failed", {
          description: errorMessage,
        });
      }
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!formData.email) return;

    try {
      await apiClient.post("/auth/resend-verification", {
        email: formData.email,
      });
      toast.success("Verification email sent!", {
        description: "Please check your inbox.",
      });
    } catch (error) {
      toast.error("Failed to resend verification email");
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setFormData({ email: "", password: "" });
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
            <DialogTitle className="text-lg">Sign in</DialogTitle>
            <DialogDescription>Welcome Back!</DialogDescription>
          </DialogHeader>

          <FieldGroup className="py-4">
            <Field>
              <Label htmlFor="signin-email">Email*</Label>
              <Input
                id="signin-email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={isLoading}
                className={errors.email ? "border-red-500" : ""}
                placeholder="you@example.com"
              />
              {errors.email && (
                <p className="text-xs text-red-500 mt-1">{errors.email}</p>
              )}
            </Field>

            <Field>
              <Label htmlFor="signin-password">Password*</Label>
              <Input
                id="signin-password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={isLoading}
                className={errors.password ? "border-red-500" : ""}
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="text-xs text-red-500 mt-1">{errors.password}</p>
              )}
            </Field>

            <Link
              to={"/forgot-password"}
              className="text-xs cursor-pointer hover:underline self-end "
            >
              Forgot password?
            </Link>
          </FieldGroup>

          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm mt-4">
              {errors.general}
            </div>
          )}

          <DialogFooter>
            <div className="flex flex-col w-full gap-2">
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
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⏳</span>
                    Signing in...
                  </span>
                ) : (
                  "Sign in"
                )}
              </Button>
            </div>
          </DialogFooter>

          <div className="flex flex-row items-center justify-center mt-4">
            <p className="text-sm text-gray-600">New here?</p>
            <Button
              variant="link"
              className="underline text-xs cursor-pointer"
              onClick={handleSignupClick}
              type="button"
            >
              Create workspace
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
