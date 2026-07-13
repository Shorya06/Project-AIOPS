import { apiClient } from "@/api/client";
import { NotificationResponseDTO } from "@/types/api";

export class NotificationService {
  /**
   * Fetches email/webhook notification logs dispatch audits.
   */
  static async getNotificationLogs(): Promise<NotificationResponseDTO[]> {
    const response = await apiClient.get<NotificationResponseDTO[]>("/api/v1/notifications");
    return response.data;
  }
}
