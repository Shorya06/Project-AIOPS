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

    public ObserverController(ObserverService observerService) {
        this.observerService = observerService;
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