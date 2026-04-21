import { Request } from "express";

export interface CreateWorkspaceAndAdminAccount extends Request {
  body: {
    workspaceName: string;
    fullName: string;
    email: string;
    password: string;
  };
}
