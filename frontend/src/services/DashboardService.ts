import { GatewayService, GatewayHealthStatus } from "./GatewayService";
import { MetricsService, SystemMetrics } from "./MetricsService";
import { HealingService } from "./HealingService";
import { NotificationService } from "./NotificationService";
import { ObserverService, ClusterTelemetry } from "./ObserverService";
import { ServiceHealthService, ServiceStatus } from "./ServiceHealthService";
import { HealingResponseDTO, NotificationResponseDTO, AlertDTO, AIAnalysisRecord } from "@/types/api";
import { apiClient } from "@/api/client";

export interface AnalysisStats {
  averageAnalysisTimeMs: number;
  totalAnalyses: number;
  lastAnalysisTimestamp: string | null;
  activeModel: string | null;
}

export interface DashboardSummary {
  gatewayHealth: GatewayHealthStatus;
  metrics: SystemMetrics;
  recentOperations: HealingResponseDTO[];
  timelineEvents: NotificationResponseDTO[];
  healingsToday: number;
  healingSuccessRate: number;
  runningPodsCount: number | "unavailable";
  activeAlertsCount: number | "unavailable";
  serviceHealth: ServiceStatus[];
  analysisStats: AnalysisStats;
  recentAlerts: AlertDTO[];
  recentDiagnoses: AIAnalysisRecord[];
  telemetry: ClusterTelemetry | null;
}

export class DashboardService {
  /**
   * Aggregates live data from actuator health, metrics, healing, notification, observer, and service health.
   * Centralizes all calculations, date filters, and status resolutions.
   */
  static async getDashboardSummary(): Promise<DashboardSummary> {
    const [gatewayHealth, metrics, recentOperations, timelineEvents, alerts, telemetry, serviceHealth, analysisStatsRaw, analysisRecords] = await Promise.all([
      GatewayService.getGatewayStatus().catch((err) => {
        console.warn("[DashboardService] Gateway Health check offline:", err.message);
        return { status: "DOWN" as const, details: "Gateway actuator unreachable" };
      }),
      MetricsService.getSystemMetrics().catch((err) => {
        console.warn("[DashboardService] Prometheus metrics scraper offline:", err.message);
        return {
          cpuUsage: 0,
          memoryUsed: 0,
          memoryMax: 0,
          avgResponseTimeMs: 0,
          jvmThreads: 0,
          gcPauseTimeMs: 0,
          http2xxCount: 0,
          http4xxCount: 0,
          http5xxCount: 0
        };
      }),
      HealingService.getHealingOperations().catch((err) => {
        console.warn("[DashboardService] Healing Service connection offline:", err.message);
        return [] as HealingResponseDTO[];
      }),
      NotificationService.getNotificationLogs().catch((err) => {
        console.warn("[DashboardService] Notification Service connection offline:", err.message);
        return [] as NotificationResponseDTO[];
      }),
      ObserverService.getActiveAlerts().catch((err) => {
        console.warn("[DashboardService] Active alerts endpoint offline:", err.message);
        return null;
      }),
      ObserverService.getClusterTelemetry().catch((err) => {
        console.warn("[DashboardService] Kubernetes cluster telemetry offline:", err.message);
        return null;
      }),
      ServiceHealthService.getAllServiceHealth().catch((err) => {
        console.warn("[DashboardService] Service health probe offline:", err.message);
        return [] as ServiceStatus[];
      }),
      apiClient.get<AnalysisStats>("/api/v1/healing/analysis/stats").then(res => res.data).catch((err) => {
        console.warn("[DashboardService] Analysis stats endpoint offline:", err.message);
        return { averageAnalysisTimeMs: 0, totalAnalyses: 0, lastAnalysisTimestamp: null, activeModel: null } as AnalysisStats;
      }),
      HealingService.getAIAnalysisRecords().catch((err) => {
        console.warn("[DashboardService] AI analysis records offline:", err.message);
        return [] as AIAnalysisRecord[];
      }),
    ]);

    // 1. Calculate AI Healings Today
    const todayStr = new Date().toISOString().substring(0, 10);
    const healingsToday = recentOperations.filter((op) => {
      if (!op.startedAt) return false;
      return op.startedAt.substring(0, 10) === todayStr;
    }).length;

    // 2. Calculate Healing Success Rate
    const totalOperations = recentOperations.length;
    const successCount = recentOperations.filter((op) => op.status === "SUCCESS").length;
    const healingSuccessRate = totalOperations > 0
      ? parseFloat(((successCount / totalOperations) * 100).toFixed(1))
      : 0;

    // 3. Sort Recent Operations Chronologically (Newest first)
    const sortedOperations = [...recentOperations].sort((a, b) => {
      return new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime();
    }).slice(0, 8);

    // 4. Sort Timeline Events Chronologically (Newest first)
    const sortedEvents = [...timelineEvents].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }).slice(0, 12);

    // 5. Resolve live telemetry counts
    const activeAlertsCount = alerts !== null ? alerts.length : "unavailable";
    const runningPodsCount = (telemetry !== null && telemetry.status === "ONLINE")
      ? telemetry.pods.length
      : "unavailable";

    // 6. Sort alerts and diagnoses for recent feeds
    const sortedAlerts = alerts !== null
      ? [...alerts].sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime()).slice(0, 5)
      : [];

    const sortedDiagnoses = [...analysisRecords].sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    }).slice(0, 5);

    return {
      gatewayHealth,
      metrics,
      recentOperations: sortedOperations,
      timelineEvents: sortedEvents,
      healingsToday,
      healingSuccessRate,
      runningPodsCount,
      activeAlertsCount,
      serviceHealth,
      analysisStats: analysisStatsRaw,
      recentAlerts: sortedAlerts,
      recentDiagnoses: sortedDiagnoses,
      telemetry,
    };
  }
}
