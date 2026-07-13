import { apiClient } from "@/api/client";
import { AlertDTO } from "@/types/api";

export interface ClusterTelemetry {
  status: "ONLINE" | "OFFLINE" | "ERROR";
  namespaces: string[];
  pods: {
    name: string;
    namespace: string;
    status: string;
    restartCount: number;
  }[];
  deployments: {
    name: string;
    namespace: string;
    replicas: number;
    readyReplicas: number;
  }[];
  services: {
    name: string;
    namespace: string;
    type: string;
  }[];
  error?: string;
}

export class ObserverService {
  /**
   * Fetch cached Alertmanager alarms received by Observer service.
   */
  static async getActiveAlerts(): Promise<AlertDTO[]> {
    const response = await apiClient.get<AlertDTO[]>("/api/v1/alerts");
    return response.data;
  }

  /**
   * Queries the live Kubernetes cluster resources mapping (namespaces, pods, deploys, svcs).
   */
  static async getClusterTelemetry(): Promise<ClusterTelemetry> {
    const response = await apiClient.get<ClusterTelemetry>("/api/v1/observer/kubernetes");
    return response.data;
  }
}
