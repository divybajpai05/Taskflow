import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import Loading from "./components/ui/Loading.tsx";

const LandingPage = lazy(() => import("./pages/LandingPage.tsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.tsx"));

export default function App() {
  return (
    <div>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </Suspense>
    </div>
  );
}
