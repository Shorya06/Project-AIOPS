package com.aiops.healing.dto;

import lombok.*;

/**
 * ==============================================================
 * AIAnalysisResult
 * ==============================================================
 *
 * Purpose:
 * Container wrapper holding the parsed AI decision along with raw prompt
 * and API response details for persistence and audit mapping.
 *
 * Why it exists:
 * Allows the orchestrating service to write complete database logs (including
 * raw responses and templates) while returning only the clean decision DTO to clients.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AIAnalysisResult {
    private AIHealingDecision decision;
    private String prompt;
    private String rawResponse;
    private String modelUsed;
}
