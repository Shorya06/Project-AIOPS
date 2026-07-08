package com.aiops.transaction.service;

import com.aiops.transaction.entity.Transaction;

import java.util.List;

/**
 * ==============================================================
 * TransactionService Interface
 * ==============================================================
 *
 * Defines the business operations supported by the
 * Transaction Service.
 */
public interface TransactionService {

    /**
     * Save a new transaction.
     */
    Transaction saveTransaction(Transaction transaction);

    /**
     * Fetch all transactions.
     */
    List<Transaction> getAllTransactions();

    /**
     * Fetch a transaction by its ID.
     */
    Transaction getTransactionById(Long id);

    /**
     * Update an existing transaction.
     */
    Transaction updateTransaction(Long id, Transaction transaction);

    /**
     * Delete a transaction.
     */
    void deleteTransaction(Long id);

}