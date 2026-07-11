package com.aiops.healing.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * ==============================================================
 * HealingOperation Entity
 * ==============================================================
 * 
 * Purpose: Represents the persistent model for an AI healing audit log.
 * 
 * Why it exists: Binds the database table "healing_operations" to Java objects,
 * storing detailed remediation stats for analysis and frontend display.
 */
@Entity
@Table(name = "healing_operations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HealingOperation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "execution_id", unique = true)
    private String executionId;

    @Column(name = "analysis_id")
    private Long analysisId;

    @Column(name = "correlation_id")
    private String correlationId;

    @Column(name = "pod_name", nullable = false)
    private String podName;

    @Column(nullable = false)
    private String namespace;

    @Enumerated(EnumType.STRING)
    @Column(name = "healing_action", nullable = false)
    private HealingAction action;

    @Enumerated(EnumType.STRING)
    @Column(name = "healing_status", nullable = false)
    private HealingStatus status;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(name = "started_at", nullable = false, updatable = false)
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "execution_duration_ms")
    private Long executionDurationMs;

    @Column(name = "validation_result", columnDefinition = "TEXT")
    private String validationResult;

    @Column(name = "failure_reason", columnDefinition = "TEXT")
    private String failureReason;

    @PrePersist
    protected void onCreate() {
        startedAt = LocalDateTime.now();
        if (status == null) {
            status = HealingStatus.PENDING;
        }
    }
}
