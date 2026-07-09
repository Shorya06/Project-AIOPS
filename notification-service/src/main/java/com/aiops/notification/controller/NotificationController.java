package com.aiops.notification.controller;

import com.aiops.notification.dto.NotificationRequestDTO;
import com.aiops.notification.dto.NotificationResponseDTO;
import com.aiops.notification.entity.Notification;
import com.aiops.notification.mapper.NotificationMapper;
import com.aiops.notification.service.NotificationService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * ==============================================================
 * NotificationController
 * ==============================================================
 *
 * PURPOSE
 * -------
 * Exposes REST APIs for Notification CRUD operations.
 */

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    /**
     * Create Notification.
     */
    @PostMapping
    public NotificationResponseDTO createNotification(
            @Valid @RequestBody NotificationRequestDTO dto) {

        Notification notification = NotificationMapper.toEntity(dto);

        Notification savedNotification = notificationService.saveNotification(notification);

        return NotificationMapper.toResponseDTO(savedNotification);
    }

    /**
     * Get all Notifications.
     */
    @GetMapping
    public List<NotificationResponseDTO> getAllNotifications() {

        return notificationService.getAllNotifications()
                .stream()
                .map(NotificationMapper::toResponseDTO)
                .toList();
    }

    /**
     * Get Notification by ID.
     */
    @GetMapping("/{id}")
    public NotificationResponseDTO getNotificationById(@PathVariable Long id) {

        Notification notification = notificationService.getNotificationById(id)
                .orElseThrow(() -> new com.aiops.notification.exception.NotificationNotFoundException(
                        "Notification not found with ID: " + id));

        return NotificationMapper.toResponseDTO(notification);
    }

    /**
     * Update Notification.
     */
    @PutMapping("/{id}")
    public NotificationResponseDTO updateNotification(
            @PathVariable Long id,
            @Valid @RequestBody NotificationRequestDTO dto) {

        Notification notification = NotificationMapper.toEntity(dto);

        Notification updated = notificationService.updateNotification(id, notification);

        return NotificationMapper.toResponseDTO(updated);
    }

    /**
     * Delete Notification.
     */
    @DeleteMapping("/{id}")
    public void deleteNotification(@PathVariable Long id) {

        notificationService.deleteNotification(id);
    }

}