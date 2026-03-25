import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import Loading from "./components/ui/Loading.tsx";
import DashboardOverview from "./components/dashboard/overview/DashboardOverview.tsx";
import Settings from "./components/dashboard/setting/Settings.tsx";
import Mytasks from "./components/dashboard/mytask/Mytasks.tsx";
import Notifications from "./components/dashboard/notifications/Notification.tsx";
import KanbanBoard from "./components/dashboard/kanban/KanbanBoard.tsx";
import Calendar from "./components/dashboard/calendar/Calendar.tsx";
import AnalyticsReport from "./components/dashboard/analytics/Analytics.tsx";
import HrDashboard from "./components/dashboard/hr_dashboard/Hr_Dashboard.tsx";
import Attendance from "./components/dashboard/attendance/Attendance.tsx";
import LeaveManagement from "./components/dashboard/leave_management/Leave_Management.tsx";
import HrCalendar from "./components/dashboard/hr_calender/Hr_Calendar.tsx";
import EmailCenter from "./components/dashboard/email_center/Email_Center.tsx";
import TeamsManagement from "./components/dashboard/teams/Teams.tsx";
import UserManagement from "./components/dashboard/user_management/User_Management.tsx";
import WorkspaceManagement from "./components/dashboard/workspaces/Workspaces.tsx";
import ActivityLogs from "./components/dashboard/activity_logs/Activity_Logs.tsx";
import NotFound from "./components/dashboard/NotFound.tsx";

const LandingPage = lazy(() => import("./pages/LandingPage.tsx"));
const DashboardLayout = lazy(
  () => import("./components/dashboard/DashboardLayout.tsx"),
);

export default function App() {
  return (
    <div>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />

          <Route path="/dashboard/*" element={<DashboardLayout />}>
            <Route index element={<DashboardOverview />} />

            {/* Application Section */}
            <Route path="tasks" element={<Mytasks />} />
            <Route path="kanban" element={<KanbanBoard />} />
            <Route path="calender" element={<Calendar />} />
            <Route path="analytics" element={<AnalyticsReport />} />
            <Route path="notifications" element={<Notifications />} />

            {/* HR Management Section */}
            <Route path="hr-dashboard" element={<HrDashboard />} />
            <Route path="attendance-management" element={<Attendance />} />
            <Route path="leave-management" element={<LeaveManagement />} />
            <Route path="hr-calendar" element={<HrCalendar />} />
            <Route path="email-center" element={<EmailCenter />} />
            <Route path="teams" element={<TeamsManagement />} />
            <Route path="user-management" element={<UserManagement />} />

            {/* Admin Section */}
            <Route path="workspaces" element={<WorkspaceManagement />} />
            <Route path="activity" element={<ActivityLogs />} />

            {/* General Settings */}
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </div>
  );
}
