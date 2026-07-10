package com.aiops.healing.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Request used to trigger a pod restart.
 */
@Data
public class RestartPodRequestDTO {

    @NotBlank
    private String podName;

    @NotBlank
    private String namespace;

    @NotBlank
    private String reason;
}