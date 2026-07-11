package com.aiops.observer.dto;

import lombok.*;

/**
 * ==============================================================
 * AlertDTO
 * ==============================================================
 *
 * Purpose:
 * Represents a single alert item nested inside the Alertmanager webhook list.
 *
 * Why it exists:
 * Holds the execution timestamps, generator URLs, status states,
 * labels, and annotations for individual alert metrics.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AlertDTO {
    private String status;
    private AlertLabelDTO labels;
    private AlertAnnotationDTO annotations;
    private String startsAt;
    private String endsAt;
    private String generatorURL;
    private String fingerprint;
}
