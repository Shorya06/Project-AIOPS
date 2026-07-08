package com.aiops.transaction.service.impl;

import com.aiops.transaction.entity.Transaction;
import com.aiops.transaction.exception.TransactionNotFoundException;
import com.aiops.transaction.repository.TransactionRepository;
import com.aiops.transaction.service.TransactionService;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * ==============================================================
 * TransactionServiceImpl
 * ==============================================================
 *
 * PURPOSE
 * -------
 * This class contains the BUSINESS LOGIC of the Transaction Service.
 *
 * In a Spring Boot application, Controllers should NEVER directly
 * interact with the database.
 *
 * Instead, the flow is:
 *
 * Client
 *    ↓
 * Controller
 *    ↓
 * Service (Business Logic)
 *    ↓
 * Repository
 *    ↓
 * PostgreSQL
 *
 * Keeping business logic inside the Service layer follows the
 * Separation of Concerns principle and makes the application
 * easier to maintain and test.
 */
@Service
public class TransactionServiceImpl implements TransactionService {

    /**
     * Repository responsible for interacting with PostgreSQL.
     *
     * Constructor Injection is preferred because:
     *
     * ✔ Recommended by Spring
     * ✔ Easier to unit test
     * ✔ Makes dependencies immutable
     */
    private final TransactionRepository transactionRepository;

    public TransactionServiceImpl(TransactionRepository transactionRepository) {
        this.transactionRepository = transactionRepository;
    }

    /**
     * ==============================================================
     * CREATE TRANSACTION
     * ==============================================================
     *
     * Saves a new transaction into the database.
     *
     * @param transaction Transaction to be saved.
     * @return Saved Transaction.
     */
    @Override
    public Transaction saveTransaction(Transaction transaction) {
        return transactionRepository.save(transaction);
    }

    /**
     * ==============================================================
     * GET ALL TRANSACTIONS
     * ==============================================================
     *
     * Retrieves every transaction stored in PostgreSQL.
     *
     * @return List of Transactions.
     */
    @Override
    public List<Transaction> getAllTransactions() {
        return transactionRepository.findAll();
    }

    /**
     * ==============================================================
     * GET TRANSACTION BY ID
     * ==============================================================
     *
     * Returns a transaction if it exists.
     *
     * If the transaction does not exist,
     * a TransactionNotFoundException is thrown.
     *
     * @param id Transaction ID
     * @return Transaction
     */
    @Override
    public Transaction getTransactionById(Long id) {
        return findTransactionById(id);
    }

    /**
     * ==============================================================
     * UPDATE TRANSACTION
     * ==============================================================
     *
     * Updates an existing transaction.
     *
     * Steps:
     * 1. Find the existing transaction.
     * 2. Update only the editable fields.
     * 3. Save the updated entity.
     *
     * @param id Transaction ID
     * @param updatedTransaction Updated transaction details.
     * @return Updated Transaction.
     */
    @Override
    public Transaction updateTransaction(Long id, Transaction updatedTransaction) {

        Transaction existingTransaction = findTransactionById(id);

        existingTransaction.setAmount(updatedTransaction.getAmount());
        existingTransaction.setStatus(updatedTransaction.getStatus());
        existingTransaction.setDescription(updatedTransaction.getDescription());

        return transactionRepository.save(existingTransaction);
    }

    /**
     * ==============================================================
     * DELETE TRANSACTION
     * ==============================================================
     *
     * Deletes a transaction.
     *
     * We first verify that the transaction exists.
     * This ensures a meaningful exception is thrown instead
     * of silently failing.
     *
     * @param id Transaction ID
     */
    @Override
    public void deleteTransaction(Long id) {

        Transaction transaction = findTransactionById(id);

        transactionRepository.delete(transaction);
    }

    /**
     * ==============================================================
     * HELPER METHOD
     * ==============================================================
     *
     * PURPOSE
     * -------
     * Fetches a transaction by ID.
     *
     * If the transaction does not exist,
     * a TransactionNotFoundException is thrown.
     *
     * WHY?
     * ----
     * This avoids duplicating the same lookup logic
     * in multiple methods (DRY Principle).
     *
     * @param id Transaction ID
     * @return Transaction
     */
    private Transaction findTransactionById(Long id) {

        return transactionRepository.findById(id)
                .orElseThrow(() ->
                        new TransactionNotFoundException(
                                "Transaction not found with ID: " + id));
    }

}