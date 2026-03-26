import { ChartBarLabel } from "../chart/chart_bar_label";
import { ChartBarLabelCustom } from "../chart/chart_bar_label_custom";
import { ChartPieLabelList } from "../chart/chart_pie_label_list";
import { ActiveTaskQueue } from "./ActiveTaskQueue";
import { LiveActivity } from "./LiveActivity";
import OverDueList from "./OverDueList";
import { TeamWorkload } from "./TeamWorkload";

export default function DashboardOverview() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <p className="text-lg font-semibold text-neutral-800">
          Performance Overview
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
          <ChartPieLabelList />
          <ChartBarLabel />
          <ChartBarLabelCustom />
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
