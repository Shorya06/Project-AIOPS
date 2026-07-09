package com.aiops.healing.dto;

import com.aiops.healing.entity.HealingAction;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

/**
 * ==============================================================
 * HealingRequestDTO
 * ==============================================================
 * 
 * Purpose: Packages incoming payload data for creating/updating a healing log.
 * 
 * Why it exists: Implements data validation via Jakarta constraints to ensure
 * clean inputs before hitting service/database layers, decoupled from JPA entities.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HealingRequestDTO {

    @NotBlank(message = "Pod name cannot be blank")
    private String podName;

    @NotBlank(message = "Namespace cannot be blank")
    private String namespace;

    @NotNull(message = "Healing action is required")
    private HealingAction action;

    @NotBlank(message = "Reason for healing cannot be blank")
    private String reason;
}
