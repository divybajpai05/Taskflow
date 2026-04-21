// src/modules/auth/auth.types.ts
export interface RegisterInput {
  workspaceName: string;
  name: string;
  email: string;
  password: string;
  confirmPassword?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface VerifyEmailInput {
  token: string;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    team: string | null;
    workspaceId: string;
    workspaceName: string;
    avatar: string | null;
    permissions: string[];
    avatarInitials: string;
    emailVerified: boolean;
  };
  tokens: {
    accessToken: string;
  };
}

export interface UserWithPermissions {
  id: string;
  email: string;
  name: string;
  role: string;
  team: string | null;
  workspaceId: string;
  permissions: string[];
  emailVerified: boolean;
}
