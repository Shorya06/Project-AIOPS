package com.aiops.transaction.controller;

import com.aiops.transaction.dto.TransactionRequestDTO;
import com.aiops.transaction.dto.TransactionResponseDTO;
import com.aiops.transaction.entity.Transaction;
import com.aiops.transaction.mapper.TransactionMapper;
import com.aiops.transaction.service.TransactionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * ==============================================================
 * TransactionController
 * ==============================================================
 *
 * PURPOSE
 * -------
 * This class exposes REST APIs for managing transactions.
 *
 * Think of the Controller as the "Receptionist" of our application.
 *
 * Responsibilities:
 * - Receives HTTP Requests
 * - Validates incoming data
 * - Calls the Service layer
 * - Returns HTTP Responses
 *
 * IMPORTANT:
 * ----------
 * Controllers should NOT contain business logic.
 * Their job is simply to coordinate requests and responses.
 */
@RestController
@RequestMapping("/api/v1/transactions")
public class TransactionController {

    /**
     * Service layer dependency.
     *
     * We use constructor injection because it is:
     * ✔ Recommended by Spring
     * ✔ Easier to test
     * ✔ Makes dependencies explicit
     */
    private final TransactionService transactionService;

    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    /**
     * ==============================================================
     * CREATE TRANSACTION
     * ==============================================================
     *
     * POST /api/v1/transactions
     *
     * Creates a new transaction.
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TransactionResponseDTO createTransaction(
            @Valid @RequestBody TransactionRequestDTO requestDTO) {

        // Convert DTO → Entity
        Transaction transaction = TransactionMapper.toEntity(requestDTO);

        // Save transaction
        Transaction savedTransaction = transactionService.saveTransaction(transaction);

        // Convert Entity → Response DTO
        return TransactionMapper.toResponseDTO(savedTransaction);
    }

    /**
     * ==============================================================
     * GET ALL TRANSACTIONS
     * ==============================================================
     *
     * GET /api/v1/transactions
     */
    @GetMapping
    public List<TransactionResponseDTO> getAllTransactions() {

        return transactionService.getAllTransactions()
                .stream()
                .map(TransactionMapper::toResponseDTO)
                .collect(Collectors.toList());
    }

    /**
     * ==============================================================
     * GET TRANSACTION BY ID
     * ==============================================================
     *
     * GET /api/v1/transactions/{id}
     */
    @GetMapping("/{id}")
    public TransactionResponseDTO getTransactionById(@PathVariable Long id) {

        Transaction transaction = transactionService.getTransactionById(id);

        return TransactionMapper.toResponseDTO(transaction);
    }

    /**
     * ==============================================================
     * UPDATE TRANSACTION
     * ==============================================================
     *
     * PUT /api/v1/transactions/{id}
     */
    @PutMapping("/{id}")
    public TransactionResponseDTO updateTransaction(
            @PathVariable Long id,
            @Valid @RequestBody TransactionRequestDTO requestDTO) {

        Transaction updatedEntity = TransactionMapper.toEntity(requestDTO);

        Transaction updatedTransaction =
                transactionService.updateTransaction(id, updatedEntity);

        return TransactionMapper.toResponseDTO(updatedTransaction);
    }

    /**
     * ==============================================================
     * DELETE TRANSACTION
     * ==============================================================
     *
     * DELETE /api/v1/transactions/{id}
     */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteTransaction(@PathVariable Long id) {

        transactionService.deleteTransaction(id);
    }
}