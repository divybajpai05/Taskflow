// App.tsx
import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import Loading from "./components/ui/Loading";

// Loader components
import DashboardOverviewLoader from "./components/loaders/DashboardOverviewLoader";
import MyTasksLoader from "./components/loaders/MyTasksLoader";
import KanbanBoardLoader from "./components/loaders/KanbanBoardLoader";
import CalendarLoader from "./components/loaders/CalendarLoader";
import AnalyticsLoader from "./components/loaders/AnalyticsLoader";
import HRDashboardLoader from "./components/loaders/HRDashboardLoader";
import AttendanceLoader from "./components/loaders/AttendanceLoader";
import LeaveManagementLoader from "./components/loaders/LeaveManagementLoader";
import HRCalendarLoader from "./components/loaders/HRCalendarLoader";
import EmailCenterLoader from "./components/loaders/EmailCenterLoader";
import TeamsLoader from "./components/loaders/TeamsLoader";
import UserManagementLoader from "./components/loaders/UserManagementLoader";
import WorkspaceLoader from "./components/loaders/WorkspaceLoader";
import ActivityLogLoader from "./components/loaders/ActivityLogLoader";
import ProtectedRoute from "./components/security/ProtectedRoute";
import { RoleManagementPage } from "./components/dashboard/role_management/RoleManagementPage";
import SettingsLoader from "./components/loaders/SettingsLoader";

// =========================================
// Lazy Loaded Page Components
// =========================================

// Public Pages
const LandingPage = lazy(() => import("./pages/LandingPage"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));


// Dashboard Layout
const DashboardLayout = lazy(
  () => import("./components/dashboard/DashboardLayout"),
);

// Application Section
const DashboardOverview = lazy(
  () => import("./components/dashboard/overview/DashboardOverview"),
);
const Mytasks = lazy(() => import("./components/dashboard/mytask/Mytasks"));
const KanbanBoard = lazy(
  () => import("./components/dashboard/kanban/KanbanBoard"),
);
const TaskFlowCalendar = lazy(
  () => import("./components/dashboard/calendar/Calendar"),
);
const AnalyticsReport = lazy(
  () => import("./components/dashboard/analytics/Analytics"),
);
const Notifications = lazy(
  () => import("./components/dashboard/notifications/Notification"),
);

// HR Management Section
const HRDashboard = lazy(
  () => import("./components/dashboard/hr_dashboard/HRDashboard"),
);
const Attendance = lazy(
  () => import("./components/dashboard/attendance/Attendance"),
);
const LeaveManagement = lazy(
  () => import("./components/dashboard/leave_management/Leave_Management"),
);
const HRCalendar = lazy(
  () => import("./components/dashboard/hr_calender/HRCalendar"),
);
const EmailCenter = lazy(
  () => import("./components/dashboard/email_center/Email_Center"),
);
const Teams = lazy(() => import("./components/dashboard/teams/Teams"));

const LeavePage = lazy(
  () => import("./components/dashboard/leave_management/LeavePage"),
);

// Admin Section
const UserManagementPage = lazy(
  () => import("./components/dashboard/user_management/User_Management"),
);
const WorkspaceSpacesPage = lazy(
  () => import("./components/dashboard/workspaces/Workspaces"),
);

const ActivityLogsPage = lazy(
  () => import("./components/dashboard/activity_logs/ActivityLogsPage"),
);



// Settings & 404
const Settings = lazy(() => import("./components/dashboard/setting/Settings"));
const NotFound = lazy(() => import("./components/dashboard/NotFound"));

// =========================================
// App Component
// =========================================

export default function App() {
  return (
    <Routes>
      {/* ========================================= */}
      {/* Public Routes (No Auth Required)          */}
      {/* ========================================= */}
      <Route
        path="/"
        element={
          <Suspense fallback={<Loading />}>
            <LandingPage />
          </Suspense>
        }
      />
      <Route
        path="/verify-email"
        element={
          <Suspense fallback={<Loading />}>
            <VerifyEmail />
          </Suspense>
        }
      />
      <Route
        path="/reset-password"
        element={
          <Suspense fallback={<Loading />}>
            <ResetPassword />
          </Suspense>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <Suspense fallback={<Loading />}>
            <ForgotPassword />
          </Suspense>
        }
      />

      {/* ========================================= */}
      {/* Protected Dashboard Routes               */}
      {/* ========================================= */}
      <Route element={<ProtectedRoute />}>
        <Route
          path="/dashboard"
          element={
            <Suspense fallback={<Loading />}>
              <DashboardLayout />
            </Suspense>
          }
        >
          {/* Overview - All logged-in users */}
          <Route
            element={<ProtectedRoute requiredPermission="dashboard_access" />}
          >
            <Route
              index
              element={
                <Suspense fallback={<DashboardOverviewLoader />}>
                  <DashboardOverview />
                </Suspense>
              }
            />
          </Route>

          {/* ========================================= */}
          {/* Application Section                      */}
          {/* ========================================= */}
          <Route element={<ProtectedRoute requiredPermission="my_tasks" />}>
            <Route
              path="tasks"
              element={
                <Suspense fallback={<MyTasksLoader />}>
                  <Mytasks />
                </Suspense>
              }
            />
          </Route>

          <Route element={<ProtectedRoute requiredPermission="kanban_board" />}>
            <Route
              path="kanban"
              element={
                <Suspense fallback={<KanbanBoardLoader />}>
                  <KanbanBoard />
                </Suspense>
              }
            />
          </Route>

          <Route element={<ProtectedRoute requiredPermission="calendar" />}>
            <Route
              path="calendar"
              element={
                <Suspense fallback={<CalendarLoader />}>
                  <TaskFlowCalendar />
                </Suspense>
              }
            />
          </Route>

          {/* Analytics - Specific permission required */}
          <Route element={<ProtectedRoute requiredPermission="analytics" />}>
            <Route
              path="analytics"
              element={
                <Suspense fallback={<AnalyticsLoader />}>
                  <AnalyticsReport />
                </Suspense>
              }
            />
          </Route>

          {/* Notifications - All logged-in users */}
          <Route
            path="notifications"
            element={
              <Suspense fallback={<Loading />}>
                <Notifications />
              </Suspense>
            }
          />

          {/* ========================================= */}
          {/* HR Management Section                    */}
          {/* ✅ requireAll={false} - Only needs ONE HR permission */}
          {/* ========================================= */}

          <Route element={<ProtectedRoute requiredPermission="hr_dashboard" />}>
            <Route
              path="hr-dashboard"
              element={
                <Suspense fallback={<HRDashboardLoader />}>
                  <HRDashboard />
                </Suspense>
              }
            />
          </Route>

          <Route element={<ProtectedRoute requiredPermission="attendance" />}>
            <Route
              path="attendance-management"
              element={
                <Suspense fallback={<AttendanceLoader />}>
                  <Attendance />
                </Suspense>
              }
            />
          </Route>

          <Route
            element={<ProtectedRoute requiredPermission="leave_management" />}
          >
            <Route
              path="leave-management"
              element={
                <Suspense fallback={<LeaveManagementLoader />}>
                  <LeaveManagement />
                </Suspense>
              }
            />
          </Route>

          <Route element={<ProtectedRoute requiredPermission="hr_calendar" />}>
            <Route
              path="hr-calendar"
              element={
                <Suspense fallback={<HRCalendarLoader />}>
                  <HRCalendar />
                </Suspense>
              }
            />
          </Route>

          <Route element={<ProtectedRoute requiredPermission="email_center" />}>
            <Route
              path="email-center"
              element={
                <Suspense fallback={<EmailCenterLoader />}>
                  <EmailCenter />
                </Suspense>
              }
            />
          </Route>

          {/* Teams - Separate from HR (Admin, HR, Manager) */}
          <Route
            element={<ProtectedRoute requiredPermission="team_management" />}
          >
            <Route
              path="teams"
              element={
                <Suspense fallback={<TeamsLoader />}>
                  <Teams />
                </Suspense>
              }
            />
          </Route>

          {/* ========================================= */}
          {/* Admin Section                             */}
          {/* ✅ requireAll={false} - Only needs ONE admin permission */}
          {/* ========================================= */}

          <Route element={<ProtectedRoute requiredPermission="workspaces" />}>
            <Route
              path="workspaces"
              element={
                <Suspense fallback={<WorkspaceLoader />}>
                  <WorkspaceSpacesPage />
                </Suspense>
              }
            />
          </Route>

          <Route
            element={<ProtectedRoute requiredPermission="user_management" />}
          >
            <Route
              path="user-management"
              element={
                <Suspense fallback={<UserManagementLoader />}>
                  <UserManagementPage />
                </Suspense>
              }
            />
          </Route>

          <Route
            element={<ProtectedRoute requiredPermission="role_management" />}
          >
            <Route
              path="role-management"
              element={
                <Suspense fallback={<UserManagementLoader />}>
                  <RoleManagementPage />
                </Suspense>
              }
            />
          </Route>

          <Route
            element={<ProtectedRoute requiredPermission="activity_logs" />}
          >
            <Route
              path="activity"
              element={
                <Suspense fallback={<ActivityLogLoader />}>
                  <ActivityLogsPage />
                </Suspense>
              }
            />
          </Route>

          {/* Settings - All logged-in users */}
          <Route
            path="settings"
            element={
              <Suspense fallback={<SettingsLoader />}>
                <Settings />
              </Suspense>
            }
          />

          {/* Dashboard 404 */}
          <Route
            path="*"
            element={
              <Suspense fallback={<Loading />}>
                <NotFound />
              </Suspense>
            }
          />

          <Route
            path="leaves"
            element={
              <Suspense fallback={<Loading />}>
                <LeavePage />
              </Suspense>
            }
          />
        </Route>
      </Route>

      {/* ========================================= */}
      {/* Global 404                                */}
      {/* ========================================= */}
      <Route
        path="*"
        element={
          <Suspense fallback={<Loading />}>
            <NotFound />
          </Suspense>
        }
      />
    </Routes>
  );
}
