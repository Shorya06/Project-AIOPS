import React, { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { toast } from "sonner";
import {
  Activity,
  Brain,
  ShieldCheck,
  Server,
  AlertTriangle,
  Clock,
  Layers,
  Cpu,
  Gauge,
  Zap,
  Radio,
  Box,
  Shield,
  Sparkles,
  Timer,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { SectionCard } from "@/components/SectionCard";
import { StatusBadge } from "@/components/StatusBadge";
import { LoadingState, ErrorState } from "@/components/FeedbackStates";
import { DashboardService } from "@/services/DashboardService";

// Utility: format a timestamp into relative time like "2m ago"
function formatRelativeTime(timestamp: string | null): string {
  if (!timestamp) return "Telemetry unavailable";
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = now - then;
  if (diffMs < 0) return "Just now";
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export const DashboardPage: React.FC = () => {
  const [metricsHistory, setMetricsHistory] = useState<{ time: string; cpu: number; memory: number }[]>([]);
  const prevGatewayStatus = useRef<string | null>(null);

  // TanStack Query to fetch aggregated SRE dashboard state
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["dashboardSummary"],
    queryFn: DashboardService.getDashboardSummary,
    refetchInterval: 15000, // Sync every 15 seconds
    retry: 1,
  });

  // Append new telemetry metrics to rolling state for real-time charting
  useEffect(() => {
    if (data?.metrics) {
      const now = new Date();
      const timeLabel = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      
      setMetricsHistory((prev) => {
        const next = [
          ...prev,
          {
            time: timeLabel,
            cpu: data.metrics.cpuUsage,
            memory: parseFloat((data.metrics.memoryUsed / (1024 * 1024)).toFixed(1)), // Convert to MB
          },
        ];
        if (next.length > 15) {
          next.shift(); // Keep last 15 data ticks
        }
        return next;
      });
    }
  }, [data?.metrics]);

  useEffect(() => {
    if (!data) return;
    const currentStatus = data.gatewayHealth.status;
    if (prevGatewayStatus.current !== null && prevGatewayStatus.current !== currentStatus) {
      if (currentStatus === "UP") {
        toast.success("Gateway Connected");
      } else {
        toast.error("Gateway Lost");
      }
    }
    prevGatewayStatus.current = currentStatus;
  }, [data]);

  if (isLoading) {
    return <LoadingState message="Collecting Gateway metrics and cluster healing history..." />;
  }

  if (error) {
    return (
      <ErrorState
        title="Gateway Obsvervability Offline"
        message="Unable to establish a secure link with the API Gateway. Verify microservices cluster routing."
        onRetry={() => refetch()}
      />
    );
  }

  const summary = data!;

  // Format bytes for readable SRE displays
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Derived values
  const runningServicesCount = summary.serviceHealth.filter(s => s.health === "Running").length;
  const totalServicesCount = summary.serviceHealth.length;
  const isClusterHealthy = summary.gatewayHealth.status === "UP";
  const deploymentsCount = summary.telemetry?.status === "ONLINE" ? summary.telemetry.deployments.length : null;

  // System overview metrics
  const overviewMetrics = [
    {
      label: "Cluster Status",
      value: isClusterHealthy ? "Healthy" : "Degraded",
      color: isClusterHealthy ? "text-emerald-400" : "text-amber-400",
      icon: Shield,
    },
    {
      label: "Gateway Status",
      value: summary.gatewayHealth.status === "UP" ? "Online" : "Offline",
      color: summary.gatewayHealth.status === "UP" ? "text-emerald-400" : "text-rose-400",
      icon: Radio,
    },
    {
      label: "Running Pods",
      value: summary.runningPodsCount === "unavailable" ? "Telemetry unavailable" : String(summary.runningPodsCount),
      color: summary.runningPodsCount === "unavailable" ? "text-zinc-500" : "text-foreground",
      icon: Box,
    },
    {
      label: "Running Deployments",
      value: deploymentsCount !== null ? String(deploymentsCount) : "Telemetry unavailable",
      color: deploymentsCount !== null ? "text-foreground" : "text-zinc-500",
      icon: Layers,
    },
    {
      label: "Running Services",
      value: totalServicesCount > 0 ? `${runningServicesCount}/${totalServicesCount}` : "Telemetry unavailable",
      color: totalServicesCount > 0 ? "text-foreground" : "text-zinc-500",
      icon: Server,
    },
    {
      label: "Active Alerts",
      value: summary.activeAlertsCount === "unavailable" ? "Telemetry unavailable" : String(summary.activeAlertsCount),
      color: summary.activeAlertsCount === "unavailable" ? "text-zinc-500" : (typeof summary.activeAlertsCount === "number" && summary.activeAlertsCount > 0 ? "text-amber-400" : "text-foreground"),
      icon: AlertTriangle,
    },
    {
      label: "Healings Today",
      value: String(summary.healingsToday),
      color: "text-foreground",
      icon: Zap,
    },
    {
      label: "Success Rate",
      value: `${summary.healingSuccessRate}%`,
      color: summary.healingSuccessRate >= 80 ? "text-emerald-400" : summary.healingSuccessRate >= 50 ? "text-amber-400" : "text-rose-400",
      icon: ShieldCheck,
    },
    {
      label: "Active AI Model",
      value: summary.analysisStats.activeModel || "Telemetry unavailable",
      color: summary.analysisStats.activeModel ? "text-foreground" : "text-zinc-500",
      icon: Sparkles,
    },
    {
      label: "Last AI Analysis",
      value: formatRelativeTime(summary.analysisStats.lastAnalysisTimestamp),
      color: summary.analysisStats.lastAnalysisTimestamp ? "text-foreground" : "text-zinc-500",
      icon: Timer,
    },
  ];

  return (
    <div className="space-y-6">
      {/* View Title */}
      <PageHeader
        title="OPERATIONS CONTROL CENTER"
        description="Kubernetes self-healing orchestrator and gateway telemetry monitors."
      />

      {/* ==========================================================
          SYSTEM OVERVIEW CARD
          ========================================================== */}
      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border/80">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold font-mono text-foreground">System Overview</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isClusterHealthy ? "bg-emerald-500 animate-pulse" : "bg-amber-500 animate-pulse"}`} />
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
              {isClusterHealthy ? "All Systems Nominal" : "Degraded Performance"}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-px bg-border/30">
          {overviewMetrics.map((metric) => (
            <div key={metric.label} className="bg-card px-4 py-3 flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <metric.icon className="w-3 h-3 text-muted-foreground/60" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">
                  {metric.label}
                </span>
              </div>
              <span className={`text-xs font-semibold font-mono truncate ${metric.color}`} title={metric.value}>
                {metric.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ==========================================================
          FIRST ROW: Platform & Status Cards
          ========================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        
        {/* Gateway Health */}
        <div className="bg-card border border-border p-4 rounded-lg flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">Gateway Health</span>
            <Server className="w-4 h-4 text-primary" />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${summary.gatewayHealth.status === "UP" ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
            <span className="text-lg font-bold font-mono uppercase tracking-tight">
              {summary.gatewayHealth.status === "UP" ? "ONLINE" : "OFFLINE"}
            </span>
          </div>
          <span className="text-[10px] text-muted-foreground mt-2 truncate">Actuator health check ok</span>
        </div>

        {/* Running Services */}
        <div className="bg-card border border-border p-4 rounded-lg flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">Running Services</span>
            <Layers className="w-4 h-4 text-primary" />
          </div>
          <div className="mt-2">
            {totalServicesCount > 0 ? (
              <div className="flex flex-col gap-1.5">
                <span className="text-2xl font-bold font-mono text-foreground">
                  {runningServicesCount}/{totalServicesCount}
                </span>
                <div className="flex flex-col gap-0.5">
                  {summary.serviceHealth.map((svc) => (
                    <div key={svc.name} className="flex items-center gap-1.5">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          svc.health === "Running"
                            ? "bg-emerald-500"
                            : svc.health === "Offline"
                            ? "bg-rose-500"
                            : "bg-zinc-500"
                        }`}
                      />
                      <span className="text-[10px] font-mono text-muted-foreground truncate">{svc.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                Backend unavailable
              </span>
            )}
          </div>
          <span className="text-[10px] text-muted-foreground mt-2 truncate">
            {totalServicesCount > 0 ? "Health probe discovery" : "No active discovery service"}
          </span>
        </div>

        {/* Running Pods */}
        <div className="bg-card border border-border p-4 rounded-lg flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">Running Pods</span>
            <Activity className="w-4 h-4 text-muted-foreground/60" />
          </div>
          <div className="mt-2">
            {summary.runningPodsCount === "unavailable" ? (
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                Backend unavailable
              </span>
            ) : (
              <span className="text-2xl font-bold font-mono text-foreground">{summary.runningPodsCount}</span>
            )}
          </div>
          <span className="text-[10px] text-muted-foreground mt-2 truncate">
            {summary.runningPodsCount === "unavailable" ? "K8s API client unmapped" : "Live cluster active pods"}
          </span>
        </div>

        {/* Active Alerts */}
        <div className="bg-card border border-border p-4 rounded-lg flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">Active Alerts</span>
            <AlertTriangle className="w-4 h-4 text-muted-foreground/60" />
          </div>
          <div className="mt-2">
            {summary.activeAlertsCount === "unavailable" ? (
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                Telemetry unavailable
              </span>
            ) : (
              <span className="text-2xl font-bold font-mono text-foreground">{summary.activeAlertsCount}</span>
            )}
          </div>
          <span className="text-[10px] text-muted-foreground mt-2 truncate">
            {summary.activeAlertsCount === "unavailable" ? "Observer feed unmapped" : "Active alert cache size"}
          </span>
        </div>

        {/* AI Healings Today */}
        <div className="bg-card border border-border p-4 rounded-lg flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">Healings Today</span>
            <Brain className="w-4 h-4 text-primary" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-foreground">{summary.healingsToday}</span>
          </div>
          <span className="text-[10px] text-muted-foreground mt-2 truncate">Remediations triggered</span>
        </div>

        {/* Healing Success Rate */}
        <div className="bg-card border border-border p-4 rounded-lg flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">Success Rate</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold font-mono text-foreground">{summary.healingSuccessRate}</span>
            <span className="text-xs text-muted-foreground">%</span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-muted h-1 rounded-full overflow-hidden mt-2">
            <div
              className="bg-emerald-500 h-full transition-all duration-500"
              style={{ width: `${summary.healingSuccessRate}%` }}
            />
          </div>
        </div>

      </div>

      {/* ==========================================================
          SECOND ROW: Metrics & Recharts Plots
          ========================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* CPU Usage Chart */}
        <div className="bg-card border border-border p-5 rounded-lg shadow-sm flex flex-col justify-between min-h-[220px]">
          <div>
            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">Gateway CPU Usage</h4>
            <div className="text-2xl font-bold font-mono mt-1 text-foreground">
              {summary.metrics.cpuUsage !== 0 ? `${summary.metrics.cpuUsage}%` : "0.0%"}
            </div>
          </div>
          <div className="h-28 mt-4 w-full">
            {metricsHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metricsHistory}>
                  <defs>
                    <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <XAxis dataKey="time" hide />
                  <YAxis hide domain={[0, 100]} />
                  <Area type="monotone" dataKey="cpu" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#cpuGrad)" strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground italic font-mono">
                No Metrics Available
              </div>
            )}
          </div>
        </div>

        {/* Memory Usage Chart */}
        <div className="bg-card border border-border p-5 rounded-lg shadow-sm flex flex-col justify-between min-h-[220px]">
          <div>
            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">Gateway JVM Memory</h4>
            <div className="text-2xl font-bold font-mono mt-1 text-foreground">
              {summary.metrics.memoryUsed !== 0 ? formatBytes(summary.metrics.memoryUsed) : "N/A"}
            </div>
            <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
              Limit: {formatBytes(summary.metrics.memoryMax)}
            </div>
          </div>
          <div className="h-28 mt-4 w-full">
            {metricsHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metricsHistory}>
                  <defs>
                    <linearGradient id="memGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <XAxis dataKey="time" hide />
                  <YAxis hide />
                  <Area type="monotone" dataKey="memory" stroke="#38bdf8" fillOpacity={1} fill="url(#memGrad)" strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground italic font-mono">
                No Metrics Available
              </div>
            )}
          </div>
        </div>

        {/* Average Response Time */}
        <div className="bg-card border border-border p-5 rounded-lg shadow-sm flex flex-col justify-between min-h-[220px]">
          <div>
            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">Average Response Time</h4>
            <div className="flex items-center gap-1.5 mt-4">
              <Clock className="w-5 h-5 text-primary" />
              <span className="text-2xl font-bold font-mono text-foreground">
                {summary.metrics.avgResponseTimeMs !== 0 ? `${summary.metrics.avgResponseTimeMs}` : "0"}
              </span>
              <span className="text-sm font-semibold text-muted-foreground">ms</span>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground leading-relaxed mt-4">
            Mean latency derived from cumulative http server actuator timers on active routed endpoints.
          </p>
        </div>

        {/* Average AI Analysis Time */}
        <div className="bg-card border border-border p-5 rounded-lg shadow-sm flex flex-col justify-between min-h-[220px]">
          <div>
            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">Average AI Analysis Time</h4>
            <div className="mt-4">
              {summary.analysisStats.totalAnalyses > 0 ? (
                <div className="flex items-center gap-1.5">
                  <Gauge className="w-5 h-5 text-primary" />
                  <span className="text-2xl font-bold font-mono text-foreground">
                    {summary.analysisStats.averageAnalysisTimeMs.toFixed(0)}
                  </span>
                  <span className="text-sm font-semibold text-muted-foreground">ms</span>
                </div>
              ) : (
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                  Telemetry unavailable
                </span>
              )}
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground leading-relaxed mt-4">
            {summary.analysisStats.totalAnalyses > 0
              ? `Averaged across ${summary.analysisStats.totalAnalyses} total analysis executions.`
              : "AI analysis latency metrics require connection to the local database audit log records."}
          </p>
        </div>

      </div>

      {/* ==========================================================
          THIRD ROW: Feeds & Actions
          ========================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Alerts Feed */}
        <SectionCard title="Recent Alerts Feed" description="Alarms dispatched by Alertmanager observer.">
          {summary.recentAlerts.length > 0 ? (
            <div className="space-y-3">
              {summary.recentAlerts.map((alert, idx) => (
                <div
                  key={alert.fingerprint || idx}
                  className="flex items-start gap-3 p-2.5 rounded-md bg-muted/20 border border-border/40 font-mono text-xs"
                >
                  <div className="mt-0.5 shrink-0">
                    <AlertTriangle
                      className={`w-3.5 h-3.5 ${
                        alert.labels.severity === "critical"
                          ? "text-rose-400"
                          : alert.labels.severity === "warning"
                          ? "text-amber-400"
                          : "text-sky-400"
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-foreground truncate">{alert.labels.alertname}</span>
                      <StatusBadge
                        label={alert.labels.severity}
                        variant={
                          alert.labels.severity === "critical"
                            ? "error"
                            : alert.labels.severity === "warning"
                            ? "warning"
                            : "info"
                        }
                      />
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                      <span className="truncate">{alert.labels.namespace}/{alert.labels.pod}</span>
                      <span className="text-[10px] shrink-0">{formatRelativeTime(alert.startsAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center text-zinc-500 font-mono text-xs">
              <AlertTriangle className="w-8 h-8 mb-2 text-zinc-600" />
              <span>No active alerts registered.</span>
            </div>
          )}
        </SectionCard>

        {/* Recent AI Diagnoses */}
        <SectionCard title="Recent AI Diagnoses" description="Root cause diagnostics parsed by Gemini Flash.">
          {summary.recentDiagnoses.length > 0 ? (
            <div className="space-y-3">
              {summary.recentDiagnoses.map((diag) => (
                <div
                  key={diag.id}
                  className="p-2.5 rounded-md bg-muted/20 border border-border/40 font-mono text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Brain className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="font-semibold text-primary truncate">{diag.recommendedAction}</span>
                    </div>
                    <StatusBadge
                      label={diag.confidence}
                      variant={
                        diag.confidence === "HIGH"
                          ? "success"
                          : diag.confidence === "MEDIUM"
                          ? "warning"
                          : "neutral"
                      }
                    />
                  </div>
                  <p className="text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
                    {diag.diagnosis}
                  </p>
                  <span className="text-[10px] text-muted-foreground/70 mt-1 block">
                    {formatRelativeTime(diag.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center text-zinc-500 font-mono text-xs">
              <Brain className="w-8 h-8 mb-2 text-zinc-600" />
              <span>No active diagnoses registered.</span>
            </div>
          )}
        </SectionCard>

        {/* Recent Healing Operations (Real Operations Table) */}
        <SectionCard title="Recent Healing Operations" description="Remediations dispatched on Kubernetes.">
          <div className="overflow-x-auto">
            {summary.recentOperations.length > 0 ? (
              <table className="w-full text-left border-collapse font-mono text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="py-2 font-bold uppercase">Pod</th>
                    <th className="py-2 font-bold uppercase">Action</th>
                    <th className="py-2 font-bold uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.recentOperations.map((op) => (
                    <tr key={op.id} className="border-b border-border/40 hover:bg-muted/10">
                      <td className="py-2 truncate max-w-[120px]" title={op.podName}>
                        {op.podName}
                      </td>
                      <td className="py-2 text-primary">{op.action}</td>
                      <td className="py-2">
                        <StatusBadge
                          label={op.status}
                          variant={
                            op.status === "SUCCESS"
                              ? "success"
                              : op.status === "FAILED"
                              ? "error"
                              : op.status === "PENDING"
                              ? "warning"
                              : "neutral"
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12 text-muted-foreground text-xs italic">
                No recent healing operations registered.
              </div>
            )}
          </div>
        </SectionCard>

      </div>

      {/* ==========================================================
          FOURTH ROW: Timeline Events Logs
          ========================================================== */}
      <SectionCard title="Platform Events Timeline" description="Chronological audit log of notification dispatches.">
        <div className="relative border-l border-border pl-6 space-y-6">
          {summary.timelineEvents.length > 0 ? (
            summary.timelineEvents.map((evt) => (
              <div key={evt.id} className="relative">
                {/* Timeline node */}
                <div className="absolute -left-[31px] mt-1.5 w-2 h-2 rounded-full bg-primary ring-4 ring-background" />
                <div className="flex items-start justify-between gap-4 font-mono text-xs">
                  <div>
                    <span className="font-semibold text-foreground mr-2">[{evt.status}]</span>
                    <span className="font-semibold text-zinc-300">{evt.subject}</span>
                    <p className="text-muted-foreground text-xs mt-1 leading-relaxed max-w-4xl whitespace-pre-line">
                      {evt.message}
                    </p>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5">
                    {new Date(evt.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-muted-foreground text-xs italic">
              No recent notifications log registered.
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  );
};

export default DashboardPage;
