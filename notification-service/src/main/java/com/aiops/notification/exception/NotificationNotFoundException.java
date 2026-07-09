package com.aiops.notification.exception;

/**
 * ==============================================================
 * NotificationNotFoundException
 * ==============================================================
 *
 * Thrown whenever a notification cannot be found.
 */
public class NotificationNotFoundException extends RuntimeException {

    public NotificationNotFoundException(String message) {
        super(message);
    }

}