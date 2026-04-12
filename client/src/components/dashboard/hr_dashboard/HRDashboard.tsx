import { useState, useCallback } from "react";
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
import { Badge } from "@/components/ui/badge";

import HRKPICards from "./components/HRKPICards";
import HRCharts from "./components/HRCharts";
import EmployeeLists from "./components/EmployeeLists";

export default function HRDashboard() {
  // ==================== FILTER STATES ====================
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date(),
  });

  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ==================== HANDLERS ====================
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    // TODO: Call backend refresh API here in future
    setTimeout(() => setIsRefreshing(false), 800);
  }, []);

  const handleExport = () => {
    // TODO: Connect to backend export API
    alert("Export HR Report functionality will be connected to backend soon!");
  };

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">HR Dashboard</h1>
          <p className="text-muted-foreground">
            Workforce overview and HR insights
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

          {/* Only Department Filter - Status filter removed */}
          <Select
            value={selectedDepartment}
            onValueChange={setSelectedDepartment}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              <SelectItem value="engineering">Engineering</SelectItem>
              <SelectItem value="design">Design</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
              <SelectItem value="sales">Sales</SelectItem>
              <SelectItem value="hr">HR</SelectItem>
              <SelectItem value="finance">Finance</SelectItem>
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

      {/* KPI Cards */}
      <HRKPICards
        dateRange={dateRange}
        selectedDepartment={selectedDepartment}
      />

      {/* Charts */}
      <HRCharts dateRange={dateRange} selectedDepartment={selectedDepartment} />

      {/* Employee Lists */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight">
          Employee Lists
        </h2>
        <EmployeeLists selectedDepartment={selectedDepartment} />
      </div>
    </div>
  );
}
