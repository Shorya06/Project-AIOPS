import { apiClient } from "@/api/client";

export interface GatewayHealthStatus {
  status: "UP" | "DOWN" | "UNKNOWN";
  details?: string;
}

export class GatewayService {
  /**
   * Queries the API Gateway health endpoint.
   */
  static async getGatewayStatus(): Promise<GatewayHealthStatus> {
    const response = await apiClient.get<{ status: string }>("/actuator/health");
    const status = response.data?.status === "UP" ? "UP" : "DOWN";
    return { status };
  }
}
