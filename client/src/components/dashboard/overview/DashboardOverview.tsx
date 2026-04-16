import { PriorityBreakdownChart } from "../chart/chart_bar_label";
import { DepartmentHeadcountChart } from "../chart/chart_bar_label_custom";
import { TaskStatusChart } from "../chart/chart_pie_label_list";
import { ActiveTaskQueue } from "./components/ActiveTaskQueue";
import { LiveActivity } from "./components/LiveActivity";
import OverDueList from "./components/OverDueList";
import { TeamWorkload } from "./components/TeamWorkload";

export default function DashboardOverview() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <p className="text-lg font-semibold text-neutral-800">
          Performance Overview
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
          <TaskStatusChart />
          <PriorityBreakdownChart />
          <DepartmentHeadcountChart />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <ActiveTaskQueue />
      </div>

      <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
        <OverDueList />
        <TeamWorkload />
        <LiveActivity />
      </div>
    </div>
  );
}
