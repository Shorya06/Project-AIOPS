package com.aiops.healing.controller;

import com.aiops.healing.dto.HealingRequestDTO;
import com.aiops.healing.dto.HealingResponseDTO;
import com.aiops.healing.entity.HealingOperation;
import com.aiops.healing.mapper.HealingMapper;
import com.aiops.healing.service.HealingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.List;

/**
 * ==============================================================
 * HealingController
 * ==============================================================
 * 
 * Purpose: Exposes HTTP endpoints for auditing self-healing events.
 * 
 * Why it exists: Acts as the client-facing entry point for API requests,
 * validating payloads using @Valid and converting between DTO and Entity layers.
 */
@RestController
@RequestMapping("/api/v1/healing")
public class HealingController {

    private final HealingService healingService;

    public HealingController(HealingService healingService) {
        this.healingService = healingService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public HealingResponseDTO createOperation(@Valid @RequestBody HealingRequestDTO dto) {
        HealingOperation entity = HealingMapper.toEntity(dto);
        HealingOperation saved = healingService.createOperation(entity);
        return HealingMapper.toResponseDTO(saved);
    }

    @GetMapping
    public List<HealingResponseDTO> getAllOperations() {
        return healingService.getAllOperations().stream()
                .map(HealingMapper::toResponseDTO)
                .toList();
    }

    @GetMapping("/{id}")
    public HealingResponseDTO getOperationById(@PathVariable Long id) {
        HealingOperation entity = healingService.getOperationById(id);
        return HealingMapper.toResponseDTO(entity);
    }

    @PutMapping("/{id}")
    public HealingResponseDTO updateOperation(@PathVariable Long id, @Valid @RequestBody HealingRequestDTO dto) {
        HealingOperation operation = HealingMapper.toEntity(dto);
        HealingOperation updated = healingService.updateOperation(id, operation);
        return HealingMapper.toResponseDTO(updated);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteOperation(@PathVariable Long id) {
        healingService.deleteOperation(id);
    }
}
