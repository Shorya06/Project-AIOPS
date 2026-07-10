package com.aiops.healing.service.impl;

import com.aiops.healing.client.NotificationClient;
import com.aiops.healing.dto.NotificationRequestDTO;
import com.aiops.healing.dto.RestartPodRequestDTO;
import com.aiops.healing.entity.HealingAction;
import com.aiops.healing.entity.HealingOperation;
import com.aiops.healing.entity.HealingStatus;
import com.aiops.healing.exception.HealingOperationNotFoundException;
import com.aiops.healing.repository.HealingRepository;
import com.aiops.healing.service.HealingService;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class HealingServiceImpl implements HealingService {

    private final HealingRepository repository;
    private final NotificationClient notificationClient;

    public HealingServiceImpl(
            HealingRepository repository,
            NotificationClient notificationClient) {
        this.repository = repository;
        this.notificationClient = notificationClient;
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

        if (operation.getStatus() != null) {
            existing.setStatus(operation.getStatus());

            if (operation.getStatus() == HealingStatus.SUCCESS ||
                    operation.getStatus() == HealingStatus.FAILED) {

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

    /**
     * Business Method
     *
     * Simulates restarting a pod.
     * (Real Kubernetes restart will be added later.)
     */
    @Override
    public HealingOperation performHealing(RestartPodRequestDTO request) {

        // Create healing record
        HealingOperation operation = new HealingOperation();

        operation.setPodName(request.getPodName());
        operation.setNamespace(request.getNamespace());
        operation.setReason(request.getReason());

        operation.setAction(HealingAction.RESTART);
        operation.setStatus(HealingStatus.SUCCESS);

        operation.setStartedAt(LocalDateTime.now());
        operation.setCompletedAt(LocalDateTime.now());

        // Save healing operation
        HealingOperation savedOperation = repository.save(operation);

        // Create notification request
        NotificationRequestDTO notification = new NotificationRequestDTO();

        notification.setRecipient("admin@aiops.com");
        notification.setSubject("Pod Restarted");

        notification.setMessage(
                "Pod '" +
                        request.getPodName() +
                        "' was restarted successfully.");

        // Call Notification Service
        notificationClient.sendNotification(notification);

        return savedOperation;
    }
}