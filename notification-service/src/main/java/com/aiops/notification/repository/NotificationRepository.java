package com.aiops.notification.repository;

import com.aiops.notification.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * ==============================================================
 * NotificationRepository
 * ==============================================================
 *
 * PURPOSE
 * -------
 * This is the DATA ACCESS layer of our application.
 *
 * Its job is to communicate with PostgreSQL.
 *
 * The repository sits between the Service layer
 * and the database.
 *
 * Controller
 * ↓
 * Service
 * ↓
 * Repository
 * ↓
 * PostgreSQL
 *
 * We extend JpaRepository, which gives us many
 * ready-made database methods without writing SQL.
 */

@Repository
public interface NotificationRepository
        extends JpaRepository<Notification, Long> {

}