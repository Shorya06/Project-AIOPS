package com.aiops.observer.service;

import com.aiops.observer.dto.PodFailureRequestDTO;

public interface ObserverService {

    void handlePodFailure(PodFailureRequestDTO request);

}