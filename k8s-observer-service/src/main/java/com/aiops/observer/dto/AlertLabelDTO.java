package com.aiops.observer.dto;

import lombok.*;

/**
 * ==============================================================
 * AlertLabelDTO
 * ==============================================================
 *
 * Purpose:
 * Models the metadata labels sent inside Alertmanager alerts.
 *
 * Why it exists:
 * Provides strongly-typed access to key alert identity labels
 * such as the alert name, target namespace, pod name, and severity.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AlertLabelDTO {
    private String alertname;
    private String namespace;
    private String pod;
    private String severity;
    private String instance;
    private String job;
}
