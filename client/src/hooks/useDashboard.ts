// src/hooks/useDashboard.ts
import { useState, useEffect, useCallback } from "react";
import { dashboardService } from "../services/dashboard.service";
import type {
  PerformanceOverview,
  ActiveTaskItem,
  OverdueTaskItem,
  TeamWorkloadData,
  LiveActivityItem,
} from "../services/dashboard.service";

export function useDashboardOverview() {
  const [data, setData] = useState<PerformanceOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const overview = await dashboardService.getPerformanceOverview();
      setData(overview);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load overview data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useActiveTasks(initialLimit = 5) {
  const [tasks, setTasks] = useState<ActiveTaskItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async (limit = 5, offset = 0) => {
    try {
      setLoading(true);
      const data = await dashboardService.getActiveTasks(limit, offset);
      setTasks(data.tasks);
      setTotal(data.total);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load active tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks(initialLimit);
  }, [fetchTasks, initialLimit]);

  return { tasks, total, loading, error, fetchTasks };
}

export function useOverdueTasks() {
  const [tasks, setTasks] = useState<OverdueTaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const data = await dashboardService.getOverdueTasks();
      setTasks(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load overdue tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return { tasks, loading, error, refetch: fetchTasks };
}

export function useTeamWorkload() {
  const [data, setData] = useState<TeamWorkloadData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const workload = await dashboardService.getTeamWorkload();
      setData(workload);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load team workload");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useLiveActivity(initialLimit = 3) {
  const [activities, setActivities] = useState<LiveActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = useCallback(async (limit = 3) => {
    try {
      setLoading(true);
      const data = await dashboardService.getLiveActivity(limit);
      setActivities(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load live activity");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivities(initialLimit);
  }, [fetchActivities, initialLimit]);

  return { activities, loading, error, fetchActivities };
}
