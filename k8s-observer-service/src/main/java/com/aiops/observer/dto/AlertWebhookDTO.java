package com.aiops.observer.dto;

import lombok.*;
import java.util.List;

/**
 * ==============================================================
 * AlertWebhookDTO
 * ==============================================================
 *
 * Purpose:
 * Represents the top-level outer payload sent by Alertmanager webhooks.
 *
 * Why it exists:
 * Parses the outer metadata wrapper (including overall firing status, group keys,
 * common annotations, and common labels) along with the array of individual alerts.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AlertWebhookDTO {
    private String version;
    private String groupKey;
    private String status;
    private String receiver;
    private AlertLabelDTO groupLabels;
    private AlertLabelDTO commonLabels;
    private AlertAnnotationDTO commonAnnotations;
    private String externalURL;
    private List<AlertDTO> alerts;
}
