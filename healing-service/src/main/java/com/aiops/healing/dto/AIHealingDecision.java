package com.aiops.healing.dto;

import com.aiops.healing.entity.HealingAction;
import lombok.*;

/**
 * ==============================================================
 * AIHealingDecision
 * ==============================================================
 *
 * Purpose:
 * Represents the final structured JSON decision returned by the Gemini AI engine.
 *
 * Why it exists:
 * Encapsulates diagnosis, reasoning, and preventive recommendations along with
 * type-safe actions and confidence enums.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AIHealingDecision {
    private String diagnosis;
    private String reasoning;
    private HealingAction recommendedAction;
    private ConfidenceLevel confidence;
    private String preventiveRecommendation;
    private ActionParameters actionParameters;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ActionParameters {
        private String memoryLimit;
        private Integer replicas;
    }
}
