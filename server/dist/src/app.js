"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const error_middleware_1 = require("./middlewares/error.middleware");
const user_routes_1 = __importDefault(require("./modules/users/user.routes"));
const role_routes_1 = __importDefault(require("./modules/roles/role.routes"));
const activity_routes_1 = __importDefault(require("./modules/activity/activity.routes"));
const workspace_routes_1 = __importDefault(require("./modules/workspaces/workspace.routes"));
const team_routes_1 = __importDefault(require("./modules/teams/team.routes"));
const email_routes_1 = __importDefault(require("./modules/email/email.routes"));
const attendance_routes_1 = __importDefault(require("./modules/attendance/attendance.routes"));
const leave_routes_1 = __importDefault(require("./modules/leaves/leave.routes"));
const task_routes_1 = __importDefault(require("./modules/tasks/task.routes"));
const dashboard_routes_1 = __importDefault(require("./modules/dashboard/dashboard.routes"));
const kanban_routes_1 = __importDefault(require("./modules/kanban/kanban.routes"));
const calendar_routes_1 = __importDefault(require("./modules/calendar/calendar.routes"));
const hr_calendar_routes_1 = __importDefault(require("./modules/hr-calendar/hr-calendar.routes"));
const hr_dashboard_routes_1 = __importDefault(require("./modules/hr-dashboard/hr-dashboard.routes"));
const analytics_routes_1 = __importDefault(require("./modules/analytics/analytics.routes"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const app = (0, express_1.default)();
const allowedOrigins = process.env.NODE_ENV === "production"
    ? [process.env.FRONTEND_URL]
    : ["http://localhost:5173"];
// CORS options
const corsOptions = {
    origin: (origin, callback) => {
        if (!origin) {
            return callback(null, true);
        }
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
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
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json({ limit: "50mb" }));
app.use(express_1.default.urlencoded({ limit: "50mb", extended: true }));
// Apply CORS middleware
app.use((0, cors_1.default)(corsOptions));
// Routes
app.use("/api/auth", auth_routes_1.default);
app.use("/api/users", user_routes_1.default);
app.use("/api/roles", role_routes_1.default);
app.use("/api/activities", activity_routes_1.default);
app.use("/api/workspaces", workspace_routes_1.default);
app.use("/api/teams", team_routes_1.default);
app.use("/api/email", email_routes_1.default);
app.use("/api/attendance", attendance_routes_1.default);
app.use("/api/leaves", leave_routes_1.default);
app.use("/api/tasks", task_routes_1.default);
app.use("/api/dashboard", dashboard_routes_1.default);
app.use("/api/kanban", kanban_routes_1.default);
app.use("/api/calendar", calendar_routes_1.default);
app.use("/api/hr-calendar", hr_calendar_routes_1.default);
app.use("/api/hr-dashboard", hr_dashboard_routes_1.default);
app.use("/api/analytics", analytics_routes_1.default);
// Health check
app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});
// Error handler
app.use(error_middleware_1.errorHandler);
app.get("/", (req, res) => {
    res.send("Working");
});
exports.default = app;
