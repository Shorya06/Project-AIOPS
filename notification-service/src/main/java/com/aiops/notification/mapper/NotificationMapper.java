package com.aiops.notification.mapper;

import com.aiops.notification.dto.NotificationRequestDTO;
import com.aiops.notification.dto.NotificationResponseDTO;
import com.aiops.notification.entity.Notification;
import com.aiops.notification.entity.NotificationStatus;

/**
 * ==============================================================
 * NotificationMapper
 * ==============================================================
 *
 * PURPOSE
 * -------
 * Converts:
 *
 * RequestDTO → Entity
 * Entity → ResponseDTO
 *
 * WHY?
 * ----
 * We never expose our Entity directly to clients.
 */
public class NotificationMapper {

    /**
     * Convert Request DTO into Entity.
     */
    public static Notification toEntity(NotificationRequestDTO dto) {

        return Notification.builder()
                .recipient(dto.getRecipient())
                .subject(dto.getSubject())
                .message(dto.getMessage())
                .status(NotificationStatus.PENDING)
                .build();
    }

    /**
     * Convert Entity into Response DTO.
     */
    public static NotificationResponseDTO toResponseDTO(Notification notification) {

        return NotificationResponseDTO.builder()
                .id(notification.getId())
                .recipient(notification.getRecipient())
                .subject(notification.getSubject())
                .message(notification.getMessage())
                .status(notification.getStatus())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}