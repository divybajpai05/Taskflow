import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import Loading from "./components/ui/Loading.tsx";
import DashboardOverview from "./components/dashboard/DashboardOverview.tsx";
import Settings from "./components/dashboard/setting/Settings.tsx";
import Mytasks from "./components/dashboard/mytask/Mytasks.tsx";

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
            <Route path="kanban" element={<div>Kanban Board</div>} />
            <Route path="calender" element={<div>Personal Calendar</div>} />
            <Route path="analytics" element={<div>Analytics</div>} />

            {/* HR Management Section */}
            <Route path="hr-dashboard" element={<div>HR Dashboard</div>} />
            <Route
              path="addendance-management"
              element={<div>Attendance</div>}
            />
            <Route
              path="leave-management"
              element={<div>Leave Management</div>}
            />
            <Route path="hr-calendar" element={<div>HR Shared Calendar</div>} />
            <Route path="email-center" element={<div>Email Center</div>} />
            <Route path="teams" element={<div>Teams List</div>} />
            <Route
              path="user-management"
              element={<div>User Management</div>}
            />

            {/* Admin Section */}
            <Route path="workspaces" element={<div>Workspaces Settings</div>} />
            <Route path="activity" element={<div>Activity Logs</div>} />

            {/* General Settings */}
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </Suspense>
    </div>
  );
}
