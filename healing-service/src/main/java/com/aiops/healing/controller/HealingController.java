package com.aiops.healing.controller;

import com.aiops.healing.dto.HealingRequestDTO;
import com.aiops.healing.dto.HealingResponseDTO;
import com.aiops.healing.dto.RestartPodRequestDTO;
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
 * PURPOSE
 * -------
 * This class exposes all REST APIs related to the Healing Service.
 *
 * WHY THIS CLASS EXISTS
 * ---------------------
 * Controllers act as the ENTRY POINT of our application.
 *
 * Their responsibility is ONLY to:
 *
 * ✔ Receive HTTP Requests
 * ✔ Validate incoming data
 * ✔ Call the Service Layer
 * ✔ Return the response back to the client
 *
 * Controllers SHOULD NOT contain business logic.
 *
 * Business logic belongs inside the Service layer.
 */
@RestController
@RequestMapping("/api/v1/healing")
public class HealingController {

    private final HealingService healingService;

    public HealingController(HealingService healingService) {
        this.healingService = healingService;
    }

    /**
     * ==============================================================
     * Create Healing Operation (CRUD)
     * ==============================================================
     *
     * Creates a healing operation record manually.
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public HealingResponseDTO createOperation(
            @Valid @RequestBody HealingRequestDTO dto) {

        HealingOperation entity = HealingMapper.toEntity(dto);

        HealingOperation saved = healingService.createOperation(entity);

        return HealingMapper.toResponseDTO(saved);
    }

    /**
     * ==============================================================
     * Perform Healing (Business Endpoint)
     * ==============================================================
     *
     * This endpoint represents the REAL work of the Healing Service.
     *
     * Instead of simply storing data,
     * this endpoint performs a healing action.
     *
     * Current Implementation:
     *
     * Simulate Pod Restart
     * ↓
     * Save Healing Operation
     * ↓
     * Notify Notification Service
     *
     * Future Implementation:
     *
     * Kubernetes Java Client
     * ↓
     * Restart Actual Pod
     * ↓
     * Store Audit Record
     * ↓
     * Notify Other Services
     */
    @PostMapping("/restart")
    @ResponseStatus(HttpStatus.CREATED)
    public HealingResponseDTO performHealing(
            @Valid @RequestBody RestartPodRequestDTO request) {

        HealingOperation operation = healingService.performHealing(request);

        return HealingMapper.toResponseDTO(operation);
    }

    /**
     * Fetch every healing operation.
     */
    @GetMapping
    public List<HealingResponseDTO> getAllOperations() {

        return healingService.getAllOperations()
                .stream()
                .map(HealingMapper::toResponseDTO)
                .toList();
    }

    /**
     * Fetch one healing operation using its ID.
     */
    @GetMapping("/{id}")
    public HealingResponseDTO getOperationById(
            @PathVariable Long id) {

        HealingOperation entity = healingService.getOperationById(id);

        return HealingMapper.toResponseDTO(entity);
    }

    /**
     * Update an existing healing operation.
     */
    @PutMapping("/{id}")
    public HealingResponseDTO updateOperation(
            @PathVariable Long id,
            @Valid @RequestBody HealingRequestDTO dto) {

        HealingOperation operation = HealingMapper.toEntity(dto);

        HealingOperation updated = healingService.updateOperation(id, operation);

        return HealingMapper.toResponseDTO(updated);
    }

    /**
     * Delete a healing operation.
     */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteOperation(
            @PathVariable Long id) {

        healingService.deleteOperation(id);
    }
}