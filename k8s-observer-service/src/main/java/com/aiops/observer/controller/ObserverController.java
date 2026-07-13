package com.aiops.observer.controller;

import com.aiops.observer.dto.PodFailureRequestDTO;
import com.aiops.observer.service.ObserverService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

/**
 * ==============================================================
 * ObserverController
 * ==============================================================
 *
 * PURPOSE
 * -------
 * Exposes REST APIs for the Kubernetes Observer Service.
 *
 * WHY THIS CLASS EXISTS
 * ---------------------
 * This service simulates Kubernetes detecting unhealthy pods.
 *
 * In the future,
 * the Kubernetes Java Client will automatically trigger
 * these APIs when real cluster events occur.
 */
@RestController
@RequestMapping("/api/v1/observer")
public class ObserverController {

    private final ObserverService observerService;
    private final com.aiops.observer.service.KubernetesContextService kubernetesContextService;

    public ObserverController(
            ObserverService observerService,
            com.aiops.observer.service.KubernetesContextService kubernetesContextService) {
        this.observerService = observerService;
        this.kubernetesContextService = kubernetesContextService;
    }

    /**
     * Exposes read-only active Kubernetes cluster telemetry.
     */
    @GetMapping("/kubernetes")
    public java.util.Map<String, Object> getClusterTelemetry() {
        return kubernetesContextService.getClusterTelemetry();
    }

    /**
     * ==============================================================
     * Detect Pod Failure
     * ==============================================================
     *
     * Simulates detection of a failed Kubernetes pod.
     *
     * Current Flow:
     *
     * Observer
     * ↓
     * Healing Service
     * ↓
     * Notification Service
     */
    @PostMapping("/pod-failure")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public void detectFailure(
            @Valid @RequestBody PodFailureRequestDTO request) {

        observerService.handlePodFailure(request);
    }
}