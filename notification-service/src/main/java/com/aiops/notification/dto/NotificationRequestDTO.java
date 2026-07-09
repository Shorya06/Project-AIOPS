package com.aiops.notification.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

/**
 * ==============================================================
 * NotificationRequestDTO
 * ==============================================================
 *
 * PURPOSE
 * -------
 * Represents the data sent by the client
 * when creating or updating a notification.
 *
 * We intentionally do NOT include:
 *
 * id
 * createdAt
 *
 * because the client should never provide them.
 */

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationRequestDTO {

    /**
     * Recipient email address.
     */
    @Email(message = "Recipient must be a valid email address.")
    @NotBlank(message = "Recipient cannot be empty.")
    private String recipient;

    /**
     * Notification subject.
     */
    @NotBlank(message = "Subject cannot be empty.")
    private String subject;

    /**
     * Notification body.
     */
    @NotBlank(message = "Message cannot be empty.")
    private String message;

}