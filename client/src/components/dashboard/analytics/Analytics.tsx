import { useState } from "react";
import { format } from "date-fns";
import { Download, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

// Import components
import KPICards from "./components/KPICards";
import OverviewCharts from "./components/OverviewCharts";
import TaskDetailsTable from "./components/TaskDetailsTable";
import TeamPerformance from "./components/TeamPerformance";
import InsightsSection from "./components/InsightsSection";
import { toast } from "sonner";

export default function AnalyticsReport() {
  // ==================== FILTER STATES ====================
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date(),
  });

  const [selectedMember, setSelectedMember] = useState<string>("all");
  const [selectedTeam, setSelectedTeam] = useState<string>("all"); // ← NEW: Team filter
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedPriority, setSelectedPriority] = useState<string>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ==================== HANDLERS ====================
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const handleExport = () => {
    toast.warning("Export functionality will connect to backend later");
  };

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Real-time insights and performance reports
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {/* Date Range */}
          <div className="flex items-center gap-2 border rounded-md px-3 py-2 bg-background">
            <input
              type="date"
              value={format(dateRange.from, "yyyy-MM-dd")}
              onChange={(e) =>
                setDateRange((prev) => ({
                  ...prev,
                  from: new Date(e.target.value),
                }))
              }
              className="bg-transparent outline-none text-sm w-32"
            />
            <span className="text-muted-foreground">→</span>
            <input
              type="date"
              value={format(dateRange.to, "yyyy-MM-dd")}
              onChange={(e) =>
                setDateRange((prev) => ({
                  ...prev,
                  to: new Date(e.target.value),
                }))
              }
              className="bg-transparent outline-none text-sm w-32"
            />
          </div>

          {/* Member Filter */}
          <Select value={selectedMember} onValueChange={setSelectedMember}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Members" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Members</SelectItem>
              <SelectItem value="prashant">Prashant Sharma</SelectItem>
              <SelectItem value="rahul">Rahul Verma</SelectItem>
              <SelectItem value="priya">Priya Singh</SelectItem>
              <SelectItem value="aarav">Aarav Patel</SelectItem>
            </SelectContent>
          </Select>

          {/* ==================== NEW: Team Filter ==================== */}
          <Select value={selectedTeam} onValueChange={setSelectedTeam}>
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="All Teams" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teams</SelectItem>
              <SelectItem value="engineering">Engineering</SelectItem>
              <SelectItem value="design">Design</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
              <SelectItem value="hr">HR</SelectItem>
              <SelectItem value="sales">Sales</SelectItem>
              {/* Add more teams as per your TaskFlow / Kanban setup */}
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Todo">Todo</SelectItem>
              <SelectItem value="In progress">In Progress</SelectItem>
              <SelectItem value="Done">Done</SelectItem>
              <SelectItem value="On Hold">On Hold</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          {/* Priority Filter */}
          <Select value={selectedPriority} onValueChange={setSelectedPriority}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>

          <Button onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Live Indicator */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Badge variant="secondary" className="bg-green-500/10 text-green-600">
          ● Live
        </Badge>
        Last updated moments ago
      </div>

      {/* Pass ALL filters (including new team filter) to every component */}
      <KPICards
        dateRange={dateRange}
        selectedMember={selectedMember}
        selectedTeam={selectedTeam}
        selectedStatus={selectedStatus}
        selectedPriority={selectedPriority}
      />

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger className="cursor-pointer" value="overview">
            Overview
          </TabsTrigger>
          <TabsTrigger className="cursor-pointer" value="team">
            Team Performance
          </TabsTrigger>
          <TabsTrigger className="cursor-pointer" value="tasks">
            Task Details
          </TabsTrigger>
          <TabsTrigger className="cursor-pointer" value="insights">
            Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewCharts
            dateRange={dateRange}
            selectedMember={selectedMember}
            selectedTeam={selectedTeam}
            selectedStatus={selectedStatus}
            selectedPriority={selectedPriority}
          />
        </TabsContent>

        <TabsContent value="team">
          <TeamPerformance
            dateRange={dateRange}
            selectedMember={selectedMember}
            selectedTeam={selectedTeam}
            selectedStatus={selectedStatus}
            selectedPriority={selectedPriority}
          />
        </TabsContent>

        <TabsContent value="tasks">
          <TaskDetailsTable
            dateRange={dateRange}
            selectedMember={selectedMember}
            selectedTeam={selectedTeam}
            selectedStatus={selectedStatus}
            selectedPriority={selectedPriority}
          />
        </TabsContent>

        <TabsContent value="insights">
          <InsightsSection
            dateRange={dateRange}
            selectedMember={selectedMember}
            selectedTeam={selectedTeam}
            selectedStatus={selectedStatus}
            selectedPriority={selectedPriority}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
