import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { PageHeader } from "@/components/PageHeader";
import { SectionCard } from "@/components/SectionCard";
import { StatusCard } from "@/components/StatusCard";
import { MetricsService } from "@/services/MetricsService";
import { HealingService } from "@/services/HealingService";
import { LoadingState, ErrorState } from "@/components/FeedbackStates";
import { Clock, Activity } from "lucide-react";

const MetricsPage: React.FC = () => {
  const [metricsHistory, setMetricsHistory] = useState<{ time: string; cpu: number; memory: number; latency: number }[]>([]);

  const { data: metrics, isLoading, error, refetch } = useQuery({
    queryKey: ["systemMetrics"],
    queryFn: MetricsService.getSystemMetrics,
    refetchInterval: 30000, // Scrape metrics every 30 seconds
    retry: 1,
  });

  const { data: analysisStats } = useQuery({
    queryKey: ["analysisStats"],
    queryFn: MetricsService.getAnalysisStats,
    retry: 1,
  });

  const { data: healingOperations } = useQuery({
    queryKey: ["healingOperations"],
    queryFn: HealingService.getHealingOperations,
    retry: 1,
  });

  // Compute average healing action duration from operations
  const avgHealingDurationMs = useMemo(() => {
    if (!healingOperations || healingOperations.length === 0) return null;

    const completedOps = healingOperations.filter((op) => op.startedAt && op.completedAt);
    if (completedOps.length === 0) return null;

    const totalMs = completedOps.reduce((sum, op) => {
      const start = new Date(op.startedAt).getTime();
      const end = new Date(op.completedAt!).getTime();
      const duration = end - start;
      return sum + (duration > 0 ? duration : 0);
    }, 0);

    return Math.round(totalMs / completedOps.length);
  }, [healingOperations]);

  useEffect(() => {
    if (metrics) {
      const now = new Date();
      const timeLabel = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

      setMetricsHistory((prev) => {
        const next = [
          ...prev,
          {
            time: timeLabel,
            cpu: metrics.cpuUsage,
            memory: parseFloat((metrics.memoryUsed / (1024 * 1024)).toFixed(1)), // MB
            latency: metrics.avgResponseTimeMs,
          },
        ];
        if (next.length > 20) {
          next.shift();
        }
        return next;
      });
    }
  }, [metrics]);

  if (isLoading) {
    return <LoadingState message="Connecting to API Gateway telemetry exporter..." />;
  }

  if (error) {
    return (
      <ErrorState
        title="No telemetry available"
        message="Unable to scrape /actuator/prometheus metrics. Verify gateway actuator settings."
        onRetry={() => refetch()}
      />
    );
  }

  const currentMetrics = metrics!;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Prometheus Telemetry"
        description="Scraping system metrics, JVM allocation heap scopes, and HTTP request averages."
      />

      {/* Primary Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatusCard title="CPU Utilization" status={`${currentMetrics.cpuUsage}%`} type="info" details="Gateway container load" />
        <StatusCard
          title="JVM Heap Memory"
          status={`${(currentMetrics.memoryUsed / (1024 * 1024)).toFixed(1)} MB`}
          type="info"
          details={`Committed limit: ${(currentMetrics.memoryMax / (1024 * 1024)).toFixed(0)} MB`}
        />
        <StatusCard title="Avg Latency Rate" status={`${currentMetrics.avgResponseTimeMs} ms`} type="info" details="HTTP Gateway timers average" />
        <StatusCard title="Actuator Exporter" status="Prometheus UP" type="healthy" details="/actuator/prometheus active" />
      </div>

      {/* JVM & GC Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatusCard
          title="JVM Threads"
          status={currentMetrics.jvmThreads > 0 ? `${currentMetrics.jvmThreads}` : "N/A"}
          type="info"
          details="Live thread count"
        />
        <StatusCard
          title="GC Pause Time"
          status={currentMetrics.gcPauseTimeMs > 0 ? `${currentMetrics.gcPauseTimeMs} ms` : "0 ms"}
          type={currentMetrics.gcPauseTimeMs > 500 ? "warning" : "info"}
          details="Total GC pause duration"
        />
        <StatusCard
          title="HTTP 2xx Responses"
          status={`${currentMetrics.http2xxCount}`}
          type="healthy"
          details="Successful request count"
        />
        <StatusCard
          title="HTTP 4xx / 5xx Errors"
          status={`${currentMetrics.http4xxCount} / ${currentMetrics.http5xxCount}`}
          type={currentMetrics.http5xxCount > 0 ? "error" : currentMetrics.http4xxCount > 0 ? "warning" : "healthy"}
          details="Client errors / Server errors"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* CPU Chart */}
        <SectionCard title="System CPU Usage Timeline" description="Monitors gateway container CPU usage over rolling ticks.">
          <div className="h-64 w-full mt-4">
            {metricsHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metricsHistory}>
                  <defs>
                    <linearGradient id="cpuArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/40)" />
                  <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Area type="monotone" dataKey="cpu" name="CPU Usage (%)" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#cpuArea)" strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground italic font-mono">
                No Metrics Available
              </div>
            )}
          </div>
        </SectionCard>

        {/* Memory Chart */}
        <SectionCard title="JVM Allocated committed Heap" description="Tracks active heap segments utilized.">
          <div className="h-64 w-full mt-4">
            {metricsHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metricsHistory}>
                  <defs>
                    <linearGradient id="memArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/40)" />
                  <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Area type="monotone" dataKey="memory" name="Heap Used (MB)" stroke="#38bdf8" fillOpacity={1} fill="url(#memArea)" strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground italic font-mono">
                No Metrics Available
              </div>
            )}
          </div>
        </SectionCard>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* AI Analysis Duration */}
        <SectionCard title="AI Analysis Duration Latency" description="Average root-cause parsing time.">
          <div className="flex flex-col items-center justify-center py-12 font-mono text-xs">
            {analysisStats && analysisStats.averageAnalysisTimeMs > 0 ? (
              <>
                <Clock className="w-8 h-8 mb-3 text-primary" />
                <span className="text-2xl font-bold text-foreground">
                  {analysisStats.averageAnalysisTimeMs.toFixed(0)} ms
                </span>
                <span className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">
                  Avg across {analysisStats.totalAnalyses} analyses
                </span>
              </>
            ) : (
              <>
                <Clock className="w-8 h-8 mb-2 text-zinc-600" />
                <span className="text-zinc-500">No telemetry available</span>
              </>
            )}
          </div>
        </SectionCard>

        {/* Healing Action Duration */}
        <SectionCard title="Healing Action Duration" description="Average cluster mutation execution time.">
          <div className="flex flex-col items-center justify-center py-12 font-mono text-xs">
            {avgHealingDurationMs !== null ? (
              <>
                <Activity className="w-8 h-8 mb-3 text-primary" />
                <span className="text-2xl font-bold text-foreground">
                  {avgHealingDurationMs} ms
                </span>
                <span className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">
                  Avg across {healingOperations?.filter((op) => op.completedAt).length ?? 0} completed ops
                </span>
              </>
            ) : (
              <>
                <Activity className="w-8 h-8 mb-2 text-zinc-600" />
                <span className="text-zinc-500">No telemetry available</span>
              </>
            )}
          </div>
        </SectionCard>

      </div>
    </div>
  );
};

export default MetricsPage;
