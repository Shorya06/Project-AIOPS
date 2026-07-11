package com.aiops.healing.entity;

import com.aiops.healing.dto.ConfidenceLevel;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * ==============================================================
 * AIAnalysisRecord Entity
 * ==============================================================
 *
 * Purpose:
 * Represents persistent audit logs of prompt runs and analysis queries.
 *
 * Why it exists:
 * Tracks prompt texts, diagnoses, reasoning and metadata for model versioning
 * and execution telemetry.
 */
@Entity
@Table(name = "ai_analysis_records")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AIAnalysisRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "correlation_id")
    private String correlationId;

    @Column(name = "validated_recommendation_snapshot", columnDefinition = "TEXT")
    private String validatedRecommendationSnapshot;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String prompt;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String diagnosis;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String reasoning;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ConfidenceLevel confidence;

    @Enumerated(EnumType.STRING)
    @Column(name = "recommended_action", nullable = false)
    private HealingAction recommendedAction;

    @Column(name = "gemini_model")
    private String geminiModel;

    @Column(name = "prompt_version")
    private String promptVersion;

    @Column(name = "raw_gemini_response", columnDefinition = "TEXT")
    private String rawGeminiResponse;

    @Column(name = "execution_duration_ms")
    private Long executionDurationMs;

    @Column(nullable = false)
    private LocalDateTime timestamp;
}
