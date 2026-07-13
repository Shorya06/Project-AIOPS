package com.aiops.healing.dto;

import com.aiops.healing.entity.HealingAction;
import com.aiops.healing.entity.HealingStatus;
import lombok.*;
import java.time.LocalDateTime;

/**
 * ==============================================================
 * HealingResponseDTO
 * ==============================================================
 * 
 * Purpose: Represents the output payload returned to the client.
 * 
 * Why it exists: Decouples the database schema (Entity) from API responses.
 * Prevents unnecessary entity fields from leaking to external clients.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HealingResponseDTO {
    private Long id;
    private String podName;
    private String namespace;
    private HealingAction action;
    private HealingStatus status;
    private String reason;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private String correlationId;
    private String executionId;
}
