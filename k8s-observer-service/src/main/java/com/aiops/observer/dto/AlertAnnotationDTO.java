package com.aiops.observer.dto;

import lombok.*;

/**
 * ==============================================================
 * AlertAnnotationDTO
 * ==============================================================
 *
 * Purpose:
 * Models the annotations (descriptions and summaries) of an Alertmanager alert.
 *
 * Why it exists:
 * Exposes descriptive text fields populated by Prometheus rules
 * to help diagnose the container failure.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AlertAnnotationDTO {
    private String summary;
    private String description;
}
