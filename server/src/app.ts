import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import authRoutes from "./modules/auth/auth.routes";
import { errorHandler } from "./middlewares/error.middleware";
import userRoutes from "./modules/users/user.routes";
import { authenticate } from "./middlewares/auth.middleware";
import roleRoutes from "./modules/roles/role.routes";
import activityRoutes from "./modules/activity/activity.routes";
import workspaceRoutes from "./modules/workspaces/workspace.routes";
import teamRoutes from "./modules/teams/team.routes";
import emailRoutes from "./modules/email/email.routes";
import attendanceRoutes from "./modules/attendance/attendance.routes";
import leaveRoutes from "./modules/leaves/leave.routes";
import taskRoutes from "./modules/tasks/task.routes";
import dashboardRoutes from "./modules/dashboard/dashboard.routes";
import kanbanRoutes from "./modules/kanban/kanban.routes";
import calendarRoutes from "./modules/calendar/calendar.routes";
import hrCalendarRoutes from "./modules/hr-calendar/hr-calendar.routes";
import hrDashboardRoutes from "./modules/hr-dashboard/hr-dashboard.routes";
import analyticsRoutes from "./modules/analytics/analytics.routes";
import leaveTypesRoutes from "./modules/leave-types/leave-types.routes";


import { db } from "./db/drizzle";
import { teams } from "./db/schema";
import { eq } from "drizzle-orm";
import cookieParser from "cookie-parser";


const app = express();

const allowedOrigins =
  process.env.NODE_ENV === "production"
    ? [process.env.FRONTEND_URL!]
    : ["http://localhost:5173"];

// CORS options
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
    "x-workspace-id",
  ],
  exposedHeaders: ["X-Total-Count", "Content-Range"], // optional
  optionsSuccessStatus: 200,
};

app.use(cookieParser());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
// Apply CORS middleware
app.use(cors(corsOptions));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/kanban", kanbanRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/hr-calendar", hrCalendarRoutes);
app.use("/api/hr-dashboard", hrDashboardRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/leave-types", leaveTypesRoutes);


// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

app.get("/", (req, res) => {
  res.send("Working");
});

export default app;
