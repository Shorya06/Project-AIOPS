package com.aiops.observer.service.impl;

import com.aiops.observer.client.HealingClient;
import com.aiops.observer.dto.PodFailureRequestDTO;
import com.aiops.observer.service.ObserverService;
import org.springframework.stereotype.Service;

/**
 * ==============================================================
 * ObserverServiceImpl
 * ==============================================================
 *
 * PURPOSE
 * -------
 * Contains the business logic of the Observer Service.
 *
 * WHY THIS CLASS EXISTS
 * ---------------------
 * The Observer Service watches the cluster.
 *
 * Whenever a pod failure is detected,
 * it forwards the request to the Healing Service.
 *
 * It does NOT repair anything itself.
 */
@Service
public class ObserverServiceImpl implements ObserverService {

    private final HealingClient healingClient;

    public ObserverServiceImpl(HealingClient healingClient) {
        this.healingClient = healingClient;
    }

    @Override
    public void handlePodFailure(PodFailureRequestDTO request) {

        // Forward failure to Healing Service
        healingClient.restartPod(request);
    }
}