import { apiClient } from "@/api/client";

export interface SystemMetrics {
  cpuUsage: number;         // Percentage (0 - 100)
  memoryUsed: number;       // Bytes
  memoryMax: number;        // Bytes
  avgResponseTimeMs: number; // Milliseconds
  jvmThreads: number;       // Live thread count
  gcPauseTimeMs: number;    // GC pause total in milliseconds
  http2xxCount: number;     // HTTP 2xx response count
  http4xxCount: number;     // HTTP 4xx response count
  http5xxCount: number;     // HTTP 5xx response count
}

export interface AnalysisStats {
  averageAnalysisTimeMs: number;
  totalAnalyses: number;
}

export class MetricsService {
  /**
   * Fetches Prometheus raw telemetry text and parses it into a typed UI model.
   * Isolates all string processing and regex/line lookups from components.
   */
  static async getSystemMetrics(): Promise<SystemMetrics> {
    const response = await apiClient.get<string>("/actuator/prometheus", {
      responseType: "text",
    });
    return this.parsePrometheusText(response.data);
  }

  /**
   * Fetches AI analysis duration statistics from the backend.
   */
  static async getAnalysisStats(): Promise<AnalysisStats> {
    const response = await apiClient.get<AnalysisStats>("/api/v1/healing/analysis/stats");
    return response.data;
  }

  private static parsePrometheusText(text: string): SystemMetrics {
    const lines = text.split("\n");
    let cpuUsage = 0;
    let memoryUsed = 0;
    let memoryMax = 0;
    let totalRequestsCount = 0;
    let totalRequestsSum = 0;
    let jvmThreads = 0;
    let gcPauseTimeSum = 0;
    let http2xxCount = 0;
    let http4xxCount = 0;
    let http5xxCount = 0;

    for (const line of lines) {
      if (line.startsWith("#")) continue;
      const trimmed = line.trim();
      if (!trimmed) continue;

      const firstSpace = trimmed.indexOf(" ");
      if (firstSpace === -1) continue;

      const metricNameAndLabels = trimmed.substring(0, firstSpace);
      const valueStr = trimmed.substring(firstSpace + 1).trim();
      const value = parseFloat(valueStr);
      if (isNaN(value)) continue;

      // Extract matching JVM, System CPU, and HTTP requests counts
      if (metricNameAndLabels.startsWith("system_cpu_usage")) {
        cpuUsage = value * 100; // e.g. 0.015 -> 1.5%
      } else if (metricNameAndLabels.startsWith("jvm_memory_used_bytes")) {
        memoryUsed += value;
      } else if (metricNameAndLabels.startsWith("jvm_memory_max_bytes")) {
        memoryMax += value;
      } else if (metricNameAndLabels.startsWith("http_server_requests_seconds_count")) {
        totalRequestsCount += value;
        // Parse HTTP status code breakdown from labels
        if (metricNameAndLabels.includes('status="2')) {
          http2xxCount += value;
        } else if (metricNameAndLabels.includes('status="4')) {
          http4xxCount += value;
        } else if (metricNameAndLabels.includes('status="5')) {
          http5xxCount += value;
        }
      } else if (metricNameAndLabels.startsWith("http_server_requests_seconds_sum")) {
        totalRequestsSum += value;
      } else if (metricNameAndLabels.startsWith("jvm_threads_live_threads")) {
        jvmThreads = value;
      } else if (metricNameAndLabels.startsWith("jvm_gc_pause_seconds_sum")) {
        gcPauseTimeSum += value;
      }
    }

    // Convert sum in seconds / count to average latency in milliseconds
    const avgResponseTimeMs = totalRequestsCount > 0
      ? (totalRequestsSum / totalRequestsCount) * 1000
      : 0;

    return {
      cpuUsage: parseFloat(cpuUsage.toFixed(2)),
      memoryUsed,
      memoryMax: memoryMax || (1024 * 1024 * 1024 * 4), // Default old-gen old limits if empty
      avgResponseTimeMs: parseFloat(avgResponseTimeMs.toFixed(2)),
      jvmThreads,
      gcPauseTimeMs: parseFloat((gcPauseTimeSum * 1000).toFixed(2)),
      http2xxCount,
      http4xxCount,
      http5xxCount,
    };
  }
}
