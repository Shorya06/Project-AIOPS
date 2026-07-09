package com.aiops.notification.service;

import com.aiops.notification.entity.Notification;

import java.util.List;
import java.util.Optional;

/**
 * ==============================================================
 * NotificationService
 * ==============================================================
 *
 * PURPOSE
 * -------
 * Defines all business operations related to notifications.
 *
 * WHY AN INTERFACE?
 * -----------------
 * Instead of writing business logic here,
 * we simply define WHAT operations are available.
 *
 * The actual implementation is written in
 * NotificationServiceImpl.
 *
 * This gives us:
 *
 * ✔ Loose Coupling
 * ✔ Easier Testing
 * ✔ Better Maintainability
 *
 * Think of this interface as a CONTRACT.
 *
 * It says:
 *
 * "Every NotificationService MUST provide
 * these methods."
 */
public interface NotificationService {

    /**
     * Save a new notification.
     */
    Notification saveNotification(Notification notification);

    /**
     * Get every notification.
     */
    List<Notification> getAllNotifications();

    /**
     * Get one notification using its ID.
     */
    Optional<Notification> getNotificationById(Long id);

    /**
     * Update an existing notification.
     */
    Notification updateNotification(Long id, Notification notification);

    /**
     * Delete a notification.
     */
    void deleteNotification(Long id);

}