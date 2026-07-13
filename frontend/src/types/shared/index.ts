/**
 * Shared utility type definitions.
 */

export type UUID = string;

export type CorrelationID = string;

export interface APIErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  requestId?: string;
}
