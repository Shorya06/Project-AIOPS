/**
 * Backend DTOs & API contract models.
 * Exclusively represents server state.
 */

export type HealingAction =
  | "RESTART_POD"
  | "SCALE_DEPLOYMENT"
  | "INCREASE_MEMORY_LIMIT"
  | "NO_ACTION";

export type HealingStatus =
  | "PENDING"
  | "SUCCESS"
  | "FAILED"
  | "PARTIAL";

export interface HealingResponseDTO {
  id: number;
  podName: string;
  namespace: string;
  action: HealingAction;
  status: HealingStatus;
  reason?: string;
  startedAt: string;
  completedAt?: string;
  correlationId?: string;
  executionId?: string;
}

export type NotificationStatus = "PENDING" | "SENT" | "FAILED";

export interface NotificationResponseDTO {
  id: number;
  recipient: string;
  subject: string;
  message: string;
  status: NotificationStatus;
  createdAt: string;
}

export interface AIAnalysisRecord {
  id: number;
  correlationId: string;
  validatedRecommendationSnapshot?: string;
  prompt: string;
  diagnosis: string;
  reasoning: string;
  confidence: "HIGH" | "MEDIUM" | "LOW" | string;
  recommendedAction: HealingAction;
  geminiModel?: string;
  promptVersion?: string;
  rawGeminiResponse?: string;
  executionDurationMs?: number;
  timestamp: string;
}

export interface AlertLabelDTO {
  alertname: string;
  namespace: string;
  pod: string;
  severity: string;
  instance?: string;
  job?: string;
}

export interface AlertAnnotationDTO {
  summary: string;
  description: string;
}

export interface AlertDTO {
  status: string;
  labels: AlertLabelDTO;
  annotations: AlertAnnotationDTO;
  startsAt: string;
  endsAt?: string;
  generatorURL?: string;
  fingerprint?: string;
}
