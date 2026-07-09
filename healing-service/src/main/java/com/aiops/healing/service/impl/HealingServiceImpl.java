package com.aiops.healing.service.impl;

import com.aiops.healing.entity.HealingOperation;
import com.aiops.healing.entity.HealingStatus;
import com.aiops.healing.exception.HealingOperationNotFoundException;
import com.aiops.healing.repository.HealingRepository;
import com.aiops.healing.service.HealingService;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

/**
 * ==============================================================
 * HealingServiceImpl
 * ==============================================================
 * 
 * Purpose: Contains the concrete business logic implementation for healing records.
 * 
 * Why it exists: Performs database lookups, throws exceptions when entities
 * are missing, updates properties, and writes records to PostgreSQL.
 */
@Service
public class HealingServiceImpl implements HealingService {

    private final HealingRepository repository;

    public HealingServiceImpl(HealingRepository repository) {
        this.repository = repository;
    }

    @Override
    public HealingOperation createOperation(HealingOperation operation) {
        return repository.save(operation);
    }

    @Override
    public List<HealingOperation> getAllOperations() {
        return repository.findAll();
    }

    @Override
    public HealingOperation getOperationById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new HealingOperationNotFoundException(
                        "Healing operation not found with ID: " + id));
    }

    @Override
    public HealingOperation updateOperation(Long id, HealingOperation operation) {
        HealingOperation existing = repository.findById(id)
                .orElseThrow(() -> new HealingOperationNotFoundException(
                        "Healing operation not found with ID: " + id));

        existing.setPodName(operation.getPodName());
        existing.setNamespace(operation.getNamespace());
        existing.setAction(operation.getAction());
        existing.setReason(operation.getReason());
        
        // If status transitions to success or failure, mark the completion time
        if (operation.getStatus() != null && operation.getStatus() != existing.getStatus()) {
            existing.setStatus(operation.getStatus());
            if (operation.getStatus() == HealingStatus.SUCCESS || operation.getStatus() == HealingStatus.FAILED) {
                existing.setCompletedAt(LocalDateTime.now());
            }
        }

        return repository.save(existing);
    }

    @Override
    public void deleteOperation(Long id) {
        HealingOperation existing = repository.findById(id)
                .orElseThrow(() -> new HealingOperationNotFoundException(
                        "Healing operation not found with ID: " + id));
        repository.delete(existing);
    }
}
