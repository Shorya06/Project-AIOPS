package com.aiops.notification.service.impl;

import com.aiops.notification.entity.Notification;
import com.aiops.notification.exception.NotificationNotFoundException;
import com.aiops.notification.repository.NotificationRepository;
import com.aiops.notification.service.NotificationService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

/**
 * ==============================================================
 * NotificationServiceImpl
 * ==============================================================
 *
 * Implements the business contract for notifications.
 *
 * annotated with @Service to let Spring Boot scan it and
 * register it in the application context as a bean.
 */
@Service
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository repository;

    public NotificationServiceImpl(NotificationRepository repository) {
        this.repository = repository;
    }

    @Override
    public Notification saveNotification(Notification notification) {
        return repository.save(notification);
    }

    @Override
    public List<Notification> getAllNotifications() {
        return repository.findAll();
    }

    @Override
    public Optional<Notification> getNotificationById(Long id) {
        return repository.findById(id);
    }

    @Override
    public Notification updateNotification(Long id, Notification notification) {
        Notification existing = repository.findById(id)
                .orElseThrow(() -> new NotificationNotFoundException(
                        "Notification not found with ID: " + id));

        existing.setRecipient(notification.getRecipient());
        existing.setSubject(notification.getSubject());
        existing.setMessage(notification.getMessage());
        existing.setStatus(notification.getStatus());

        return repository.save(existing);
    }

    @Override
    public void deleteNotification(Long id) {
        Notification existing = repository.findById(id)
                .orElseThrow(() -> new NotificationNotFoundException(
                        "Notification not found with ID: " + id));
        repository.delete(existing);
    }
}
