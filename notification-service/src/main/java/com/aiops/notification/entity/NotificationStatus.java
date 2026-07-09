package com.aiops.notification.entity;

/**
 * ==============================================================
 * NotificationStatus
 * ==============================================================
 *
 * PURPOSE
 * -------
 * Represents the current state of a notification.
 *
 * WHY USE AN ENUM?
 * ----------------
 * Instead of allowing any random String like:
 *
 * "done"
 * "completed"
 * "finished"
 * "yes"
 *
 * we restrict the values to a fixed set.
 *
 * This improves:
 * ✔ Type Safety
 * ✔ Readability
 * ✔ Database Consistency
 */
public enum NotificationStatus {

    /**
     * Notification has been created
     * but has not yet been sent.
     */
    PENDING,

    /**
     * Notification was successfully sent.
     */
    SENT,

    /**
     * Sending failed.
     * We may retry later.
     */
    FAILED

}