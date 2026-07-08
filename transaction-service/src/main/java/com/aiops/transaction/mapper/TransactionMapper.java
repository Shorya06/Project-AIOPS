package com.aiops.transaction.mapper;

import com.aiops.transaction.dto.TransactionRequestDTO;
import com.aiops.transaction.dto.TransactionResponseDTO;
import com.aiops.transaction.entity.Transaction;

/**
 * ==============================================================
 * TransactionMapper
 * ==============================================================
 *
 * Maps between DTO models and JPA Database Entities.
 */
public class TransactionMapper {

    public static Transaction toEntity(TransactionRequestDTO requestDTO) {
        if (requestDTO == null) {
            return null;
        }
        return Transaction.builder()
                .amount(requestDTO.getAmount())
                .status(requestDTO.getStatus())
                .description(requestDTO.getDescription())
                .build();
    }

    public static TransactionResponseDTO toResponseDTO(Transaction transaction) {
        if (transaction == null) {
            return null;
        }
        return TransactionResponseDTO.builder()
                .id(transaction.getId())
                .amount(transaction.getAmount())
                .status(transaction.getStatus())
                .description(transaction.getDescription())
                .createdAt(transaction.getCreatedAt())
                .updatedAt(transaction.getUpdatedAt())
                .build();
    }
}
