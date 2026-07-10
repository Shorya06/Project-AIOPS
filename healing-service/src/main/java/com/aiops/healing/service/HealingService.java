package com.aiops.healing.service;

import com.aiops.healing.dto.RestartPodRequestDTO;
import com.aiops.healing.entity.HealingOperation;
import java.util.List;

/**
 * ==============================================================
 * HealingService Interface
 * ==============================================================
 * 
 * Purpose: Defines the business logic contract for managing healing operations.
 * 
 * Why it exists: Abstracts business requirements away from controller endpoints
 * and direct database repositories, satisfying loose coupling and Dependency
 * Inversion.
 */
public interface HealingService {

    HealingOperation createOperation(HealingOperation operation);

    List<HealingOperation> getAllOperations();

    HealingOperation getOperationById(Long id);

    HealingOperation updateOperation(Long id, HealingOperation operation);

    void deleteOperation(Long id);

    HealingOperation performHealing(RestartPodRequestDTO request);
}
