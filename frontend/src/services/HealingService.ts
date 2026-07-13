import { apiClient } from "@/api/client";
import { HealingResponseDTO, AIAnalysisRecord } from "@/types/api";

export class HealingService {
  /**
   * Fetches the complete list of self-healing operations logs.
   */
  static async getHealingOperations(): Promise<HealingResponseDTO[]> {
    const response = await apiClient.get<HealingResponseDTO[]>("/api/v1/healing");
    return response.data;
  }

  /**
   * Fetches the complete history of AI analysis records.
   */
  static async getAIAnalysisRecords(): Promise<AIAnalysisRecord[]> {
    const response = await apiClient.get<AIAnalysisRecord[]>("/api/v1/healing/analysis");
    return response.data;
  }
}
