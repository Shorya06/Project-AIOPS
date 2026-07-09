package com.aiops.healing.mapper;

import com.aiops.healing.dto.HealingRequestDTO;
import com.aiops.healing.dto.HealingResponseDTO;
import com.aiops.healing.entity.HealingOperation;
import com.aiops.healing.entity.HealingStatus;

/**
 * ==============================================================
 * HealingMapper Utility
 * ==============================================================
 * 
 * Purpose: Performs manual mapping between entity objects and DTO models.
 * 
 * Why it exists: Encapsulates entity-to-DTO conversion logic to keep controllers
 * clean and ensure default fields (like HealingStatus.PENDING) are assigned on creation.
 */
public class HealingMapper {

    public static HealingOperation toEntity(HealingRequestDTO dto) {
        if (dto == null) {
            return null;
        }
        return HealingOperation.builder()
                .podName(dto.getPodName())
                .namespace(dto.getNamespace())
                .action(dto.getAction())
                .reason(dto.getReason())
                .status(HealingStatus.PENDING)
                .build();
    }

    public static HealingResponseDTO toResponseDTO(HealingOperation entity) {
        if (entity == null) {
            return null;
        }
        return HealingResponseDTO.builder()
                .id(entity.getId())
                .podName(entity.getPodName())
                .namespace(entity.getNamespace())
                .action(entity.getAction())
                .status(entity.getStatus())
                .reason(entity.getReason())
                .startedAt(entity.getStartedAt())
                .completedAt(entity.getCompletedAt())
                .build();
    }
}
