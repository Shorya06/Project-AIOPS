package com.aiops.healing.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * ==========================================================
 * NotificationRequestDTO
 * ==========================================================
 *
 * This DTO represents the JSON payload that will be sent
 * from the Healing Service to the Notification Service.
 *
 * Although Notification Service has its own DTO,
 * microservices should not depend on each other's Java classes.
 *
 * They communicate using JSON over HTTP.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationRequestDTO {

    @NotBlank
    private String recipient;

    @NotBlank
    private String subject;

    @NotBlank
    private String message;
}