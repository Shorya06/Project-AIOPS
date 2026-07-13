package com.aiops.observer.controller;

import com.aiops.observer.dto.AlertWebhookDTO;
import com.aiops.observer.service.AlertProcessingService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * ==============================================================
 * AlertController
 * ==============================================================
 *
 * Purpose:
 * Receives Alertmanager webhook notifications whenever
 * Prometheus detects Kubernetes issues.
 *
 * Why it exists:
 * Serves as the entry point into the AI-powered healing
 * pipeline while keeping webhook handling separate from
 * business logic.
 */
@RestController
@RequestMapping("/api/v1/alerts")
public class AlertController {

    private static final Logger log = LoggerFactory.getLogger(AlertController.class);
    private final AlertProcessingService alertProcessingService;

    private static final java.util.List<com.aiops.observer.dto.AlertDTO> alertCache = new java.util.concurrent.CopyOnWriteArrayList<>();

    public AlertController(AlertProcessingService alertProcessingService) {
        this.alertProcessingService = alertProcessingService;
    }

    @GetMapping
    public java.util.List<com.aiops.observer.dto.AlertDTO> getAlertCache() {
        return alertCache;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.ACCEPTED)
    public void receiveAlert(@Valid @RequestBody AlertWebhookDTO request) {
        String correlationId = UUID.randomUUID().toString();
        MDC.put("correlationId", correlationId);
        log.info("[CorrelationID: {}] Received Alertmanager webhook notification.", correlationId);
        
        // Cache alerts
        if (request != null && request.getAlerts() != null) {
            alertCache.addAll(request.getAlerts());
            while (alertCache.size() > 50) {
                alertCache.remove(0);
            }
        }

        try {
            alertProcessingService.processAlerts(request, correlationId);
        } finally {
            MDC.remove("correlationId");
        }
    }
}
