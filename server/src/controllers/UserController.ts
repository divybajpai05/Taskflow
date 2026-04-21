import { NextFunction, Request, Response } from "express";
import { CreateWorkspaceAndAdminAccount } from "../types/userTypes";

export default function CreateWorkSpaceAndCreateAdminAccount(
  req: CreateWorkspaceAndAdminAccount,
  res: Response,
  next: NextFunction,
) {
  try {
    const { workspaceName, fullName, email, password } = req.body;

    if (!workspaceName && !fullName && !email && !password) {
      return res.status(400).json({
        success: false,
        message: "Please fill all the fields",
      });
      }
      
      
  } catch (error) {
    next(error);
  }
}
