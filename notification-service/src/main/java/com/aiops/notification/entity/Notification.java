package com.aiops.notification.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * ==============================================================
 * Notification Entity
 * ==============================================================
 *
 * PURPOSE
 * -------
 * Represents a notification stored in PostgreSQL.
 *
 * Hibernate uses this class to automatically create
 * the "notifications" table.
 *
 * Think of an Entity as a blueprint of a database table.
 *
 * Every object of this class represents one row
 * inside the database.
 */

@Entity
@Table(name = "notifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    /**
     * Primary Key.
     *
     * PostgreSQL generates this automatically.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Recipient of the notification.
     *
     * Example:
     * admin@company.com
     */
    @Column(nullable = false)
    private String recipient;

    /**
     * Subject of the notification.
     *
     * Example:
     * Pod Failure Detected
     */
    @Column(nullable = false)
    private String subject;

    /**
     * Main notification content.
     */
    @Column(nullable = false)
    private String message;

    /**
     * Current notification status.
     *
     * Stored as text inside PostgreSQL.
     *
     * Example:
     * PENDING
     * SENT
     * FAILED
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationStatus status;

    /**
     * Timestamp when the notification was created.
     */
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    /**
     * Automatically sets createdAt before inserting
     * a new record into PostgreSQL.
     *
     * We use @PrePersist so developers don't have to
     * manually set the timestamp every time.
     */
    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
    }
}