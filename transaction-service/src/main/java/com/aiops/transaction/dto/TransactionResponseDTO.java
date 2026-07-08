package com.aiops.transaction.dto;

import com.aiops.transaction.entity.TransactionStatus;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * ==============================================================
 * TransactionResponseDTO
 * ==============================================================
 *
 * Represents the data returned to the client in API responses.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransactionResponseDTO {
    private Long id;
    private BigDecimal amount;
    private TransactionStatus status;
    private String description;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
