package com.aiops.observer.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * ==============================================================
 * PodFailureRequestDTO
 * ==============================================================
 *
 * PURPOSE
 * -------
 * Represents a Kubernetes pod failure detected by the Observer Service.
 *
 * This DTO is forwarded directly to the Healing Service.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PodFailureRequestDTO {

    @NotBlank
    private String podName;

    @NotBlank
    private String namespace;

    @NotBlank
    private String reason;
}