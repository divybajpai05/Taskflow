// src/pages/ResetPassword.tsx
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import apiClient from "../api/client";

interface FormData {
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  password?: string;
  confirmPassword?: string;
  general?: string;
}

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token");

  const [formData, setFormData] = useState<FormData>({
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);

  // Validate token format on mount
  useEffect(() => {
    if (!token || token.length < 32) {
      setTokenValid(false);
    }
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear field error when typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    const loadingToastId = toast.loading("Resetting your password...");

    try {
      const response = await apiClient.post("/auth/reset-password", {
        token,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });

      if (response.data.success) {
        toast.dismiss(loadingToastId);

        setIsSuccess(true);

        toast.success("✅ Password reset successful!", {
          description: "You can now log in with your new password.",
          duration: 5000,
        });

        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate("/");
        }, 3000);
      }
    } catch (error: any) {
      toast.dismiss(loadingToastId);

      console.error("Reset password error:", error);

      const errorMessage =
        error.response?.data?.error ||
        "Failed to reset password. Please try again.";

      if (errorMessage.includes("expired")) {
        setErrors({
          general: "This reset link has expired. Please request a new one.",
        });
        setTokenValid(false);
      } else if (errorMessage.includes("Invalid")) {
        setErrors({
          general: "This reset link is invalid or has already been used.",
        });
        setTokenValid(false);
      } else {
        setErrors({ general: errorMessage });
      }

      toast.error("Reset failed", {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = () => {
    navigate("/forgot-password");
  };

  // Invalid token view
  if (!tokenValid) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="text-5xl mb-4">🔗</div>
            <CardTitle className="text-2xl">Invalid Reset Link</CardTitle>
            <CardDescription>
              This password reset link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center text-gray-600">
            <p>Please request a new password reset link to continue.</p>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button onClick={handleResendEmail} className="w-full cursor-pointer">
              Request New Reset Link
            </Button>
            <Link to="/" className="text-sm text-blue-600 hover:underline cursor-pointer">
              Back to Sign In
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Success view
  if (isSuccess) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="text-5xl mb-4">✅</div>
            <CardTitle className="text-2xl text-green-600">
              Password Reset!
            </CardTitle>
            <CardDescription>
              Your password has been successfully updated.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center text-gray-600">
            <p>You can now log in with your new password.</p>
            <p className="text-sm mt-4">Redirecting to login page...</p>
          </CardContent>
          <CardFooter>
            <Link to="/" className="w-full">
              <Button className="w-full cursor-pointer">Go to Sign In</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Main form view
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="text-5xl mb-4">🔐</div>
          <CardTitle className="text-2xl">Reset Your Password</CardTitle>
          <CardDescription>Enter your new password below.</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password*</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={isLoading}
                className={errors.password ? "border-red-500" : ""}
                placeholder="••••••••"
                autoComplete="new-password"
              />
              {errors.password && (
                <p className="text-xs text-red-500">{errors.password}</p>
              )}
              <p className="text-xs text-gray-500">
                Must be at least 8 characters with uppercase, lowercase, and
                number
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password*</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                disabled={isLoading}
                className={errors.confirmPassword ? "border-red-500" : ""}
                placeholder="••••••••"
                autoComplete="new-password"
              />
              {errors.confirmPassword && (
                <p className="text-xs text-red-500">{errors.confirmPassword}</p>
              )}
            </div>

            {errors.general && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {errors.general}
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full cursor-pointer" disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span>
                  Resetting...
                </span>
              ) : (
                "Reset Password"
              )}
            </Button>

            <Link to="/" className="text-sm text-blue-600 hover:underline">
              Back to Sign In
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
