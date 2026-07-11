package com.aiops.healing.service.impl;

import com.aiops.healing.client.NotificationClient;
import com.aiops.healing.component.PromptBuilder;
import com.aiops.healing.config.HealingPolicyProperties;
import com.aiops.healing.context.FailureContext;
import com.aiops.healing.dto.AIAnalysisResult;
import com.aiops.healing.dto.AIHealingDecision;
import com.aiops.healing.dto.NotificationRequestDTO;
import com.aiops.healing.dto.RestartPodRequestDTO;
import com.aiops.healing.entity.AIAnalysisRecord;
import com.aiops.healing.entity.HealingAction;
import com.aiops.healing.entity.HealingOperation;
import com.aiops.healing.entity.HealingStatus;
import com.aiops.healing.exception.HealingOperationNotFoundException;
import com.aiops.healing.repository.AIAnalysisRecordRepository;
import com.aiops.healing.repository.HealingRepository;
import com.aiops.healing.service.AIAnalysisService;
import com.aiops.healing.service.HealingExecutionService;
import com.aiops.healing.service.HealingPolicyService;
import com.aiops.healing.service.HealingService;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

/**
 * ==============================================================
 * HealingServiceImpl
 * ==============================================================
 * 
 * Purpose:
 * Implements core healing orchestration, applies validation policies,
 * triggers Kubernetes execution mutations, exposes Micrometer metrics, and starts feedback checks.
 * 
 * Why it exists:
 * Serves as the central coordination class for the AI-Powered Self-Healing Engine.
 */
@Service
public class HealingServiceImpl implements HealingService {

    private static final Logger log = LoggerFactory.getLogger(HealingServiceImpl.class);

    private final HealingRepository repository;
    private final NotificationClient notificationClient;
    private final PromptBuilder promptBuilder;
    private final AIAnalysisService aiAnalysisService;
    private final AIAnalysisRecordRepository aiAnalysisRecordRepository;
    
    private final HealingPolicyService healingPolicyService;
    private final HealingExecutionService healingExecutionService;
    private final HealingPolicyProperties policyProperties;
    private final ObjectMapper objectMapper;

    // Micrometer metrics
    private final Counter healingTotalCounter;
    private final Counter healingSuccessCounter;
    private final Counter healingFailedCounter;
    private final Counter validationFailuresCounter;
    private final Timer healingDurationTimer;
    private final Timer analysisDurationTimer;

    public HealingServiceImpl(
            HealingRepository repository,
            NotificationClient notificationClient,
            PromptBuilder promptBuilder,
            AIAnalysisService aiAnalysisService,
            AIAnalysisRecordRepository aiAnalysisRecordRepository,
            HealingPolicyService healingPolicyService,
            HealingExecutionService healingExecutionService,
            HealingPolicyProperties policyProperties,
            ObjectMapper objectMapper,
            MeterRegistry meterRegistry) {
        this.repository = repository;
        this.notificationClient = notificationClient;
        this.promptBuilder = promptBuilder;
        this.aiAnalysisService = aiAnalysisService;
        this.aiAnalysisRecordRepository = aiAnalysisRecordRepository;
        this.healingPolicyService = healingPolicyService;
        this.healingExecutionService = healingExecutionService;
        this.policyProperties = policyProperties;
        this.objectMapper = objectMapper;

        // Initialize Micrometer metrics
        this.healingTotalCounter = meterRegistry.counter("ai_healing_total");
        this.healingSuccessCounter = meterRegistry.counter("ai_healing_success_total");
        this.healingFailedCounter = meterRegistry.counter("ai_healing_failed_total");
        this.validationFailuresCounter = meterRegistry.counter("ai_healing_validation_failures");
        this.healingDurationTimer = meterRegistry.timer("ai_healing_duration");
        this.analysisDurationTimer = meterRegistry.timer("ai_analysis_duration");
    }

    @Override
    public HealingOperation createOperation(HealingOperation operation) {
        return repository.save(operation);
    }

    @Override
    public List<HealingOperation> getAllOperations() {
        return repository.findAll();
    }

    @Override
    public HealingOperation getOperationById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new HealingOperationNotFoundException(
                        "Healing operation not found with ID: " + id));
    }

    @Override
    public HealingOperation updateOperation(Long id, HealingOperation operation) {
        HealingOperation existing = repository.findById(id)
                .orElseThrow(() -> new HealingOperationNotFoundException(
                        "Healing operation not found with ID: " + id));

        existing.setPodName(operation.getPodName());
        existing.setNamespace(operation.getNamespace());
        existing.setAction(operation.getAction());
        existing.setReason(operation.getReason());

        if (operation.getStatus() != null) {
            existing.setStatus(operation.getStatus());

            if (operation.getStatus() == HealingStatus.SUCCESS ||
                    operation.getStatus() == HealingStatus.FAILED ||
                    operation.getStatus() == HealingStatus.PARTIAL) {

                existing.setCompletedAt(LocalDateTime.now());
            }
        }

        return repository.save(existing);
    }

    @Override
    public void deleteOperation(Long id) {
        HealingOperation existing = repository.findById(id)
                .orElseThrow(() -> new HealingOperationNotFoundException(
                        "Healing operation not found with ID: " + id));
        repository.delete(existing);
    }

    @Override
    public HealingOperation performHealing(RestartPodRequestDTO request) {
        HealingOperation operation = new HealingOperation();
        operation.setPodName(request.getPodName());
        operation.setNamespace(request.getNamespace());
        operation.setReason(request.getReason());

        operation.setAction(HealingAction.RESTART_POD);
        operation.setStatus(HealingStatus.SUCCESS);
        operation.setExecutionId(UUID.randomUUID().toString());
        operation.setCorrelationId(UUID.randomUUID().toString());

        operation.setStartedAt(LocalDateTime.now());
        operation.setCompletedAt(LocalDateTime.now());

        HealingOperation savedOperation = repository.save(operation);

        NotificationRequestDTO notification = new NotificationRequestDTO();
        notification.setRecipient("admin@aiops.com");
        notification.setSubject("Manual Pod Restarted");
        notification.setMessage("Pod '" + request.getPodName() + "' was restarted manually.");
        notificationClient.sendNotification(notification);

        return savedOperation;
    }

    /**
     * AI Analysis & Self-Healing Remediation Loop
     */
    @Override
    public AIHealingDecision analyzeFailure(FailureContext context) {
        String correlationId = context.getCorrelationId();
        if (correlationId == null || correlationId.isEmpty()) {
            correlationId = UUID.randomUUID().toString();
        }

        log.info("[CorrelationID: {}] Processing analyzeFailure request for Pod: {}", correlationId, context.getPodName());

        long startTime = System.currentTimeMillis();

        // 1. Build prompt and query AI Provider
        String prompt = promptBuilder.buildPrompt(context);
        AIAnalysisResult result = aiAnalysisService.analyzeFailure(context, prompt, correlationId);
        
        long analysisDuration = System.currentTimeMillis() - startTime;
        analysisDurationTimer.record(analysisDuration, TimeUnit.MILLISECONDS);

        // 2. APPLY HEALING POLICY VALIDATION LAYER
        AIHealingDecision decision = result.getDecision();
        HealingAction originalAction = decision.getRecommendedAction();
        healingPolicyService.validateDecision(decision);
        
        HealingAction validatedAction = decision.getRecommendedAction();

        // Serialize validated decision snapshot
        String validatedSnapshotJson = "";
        try {
            validatedSnapshotJson = objectMapper.writeValueAsString(decision);
        } catch (Exception e) {
            log.error("[CorrelationID: {}] Failed to serialize validated decision snapshot: {}", correlationId, e.getMessage());
        }

        // Save AIAnalysisRecord audit log
        AIAnalysisRecord record = AIAnalysisRecord.builder()
                .correlationId(correlationId)
                .validatedRecommendationSnapshot(validatedSnapshotJson)
                .prompt(result.getPrompt())
                .diagnosis(result.getDecision().getDiagnosis())
                .reasoning(result.getDecision().getReasoning())
                .confidence(result.getDecision().getConfidence())
                .recommendedAction(result.getDecision().getRecommendedAction())
                .timestamp(LocalDateTime.now())
                .geminiModel(result.getModelUsed())
                .promptVersion("1.0.0")
                .rawGeminiResponse(result.getRawResponse())
                .executionDurationMs(analysisDuration)
                .build();
        record = aiAnalysisRecordRepository.save(record);
        final Long analysisId = record.getId();

        // Generate trace elements
        String executionId = UUID.randomUUID().toString();

        // 3. AUDIT REMEDIATION INITIALIZATION (SAVED BEFORE EXECUTION)
        HealingOperation operation = HealingOperation.builder()
                .executionId(executionId)
                .analysisId(analysisId)
                .correlationId(correlationId)
                .podName(context.getPodName())
                .namespace(context.getNamespace())
                .action(validatedAction)
                .status(HealingStatus.PENDING)
                .reason(decision.getDiagnosis())
                .validationResult("Original AI recommendation: " + originalAction + ". Validated Action: " + validatedAction)
                .startedAt(LocalDateTime.now())
                .build();
        
        operation = repository.save(operation);
        final Long operationId = operation.getId();

        // Increment Micrometer totals
        healingTotalCounter.increment();

        if (validatedAction == HealingAction.NO_ACTION) {
            log.info("[CorrelationID: {}] Policy set to NO_ACTION. Remediation skipped.", correlationId);
            if (originalAction != HealingAction.NO_ACTION) {
                validationFailuresCounter.increment();
            }
            operation.setStatus(HealingStatus.SUCCESS);
            operation.setCompletedAt(LocalDateTime.now());
            operation.setExecutionDurationMs(0L);
            repository.save(operation);
            return decision;
        }

        // 4. EXECUTE KUBERNETES REMEDIATION
        long execStartTime = System.currentTimeMillis();
        try {
            HealingOperation finalOperation = operation;
            String finalCorrelationId = correlationId;
            healingDurationTimer.record(() -> {
                healingExecutionService.executeRemediation(
                        context.getPodName(),
                        context.getNamespace(),
                        context.getDeploymentName(),
                        decision
                );
            });

            long execDuration = System.currentTimeMillis() - execStartTime;
            operation.setStatus(HealingStatus.SUCCESS);
            operation.setCompletedAt(LocalDateTime.now());
            operation.setExecutionDurationMs(execDuration);
            healingSuccessCounter.increment();
            repository.save(operation);

            log.info("[CorrelationID: {}] Remediation execution completed successfully. Action: {}", correlationId, validatedAction);
            sendRemediationNotification(context.getPodName(), decision, "SUCCESS", correlationId);

            // 5. TRIGGER COOLDOWN FEEDBACK LOOP ASYNC
            triggerFeedbackLoop(context.getPodName(), context.getNamespace(), operationId, correlationId);

        } catch (Exception e) {
            long execDuration = System.currentTimeMillis() - execStartTime;
            log.error("[CorrelationID: {}] Remediation execution failed for pod {}: {}", correlationId, context.getPodName(), e.getMessage());
            operation.setStatus(HealingStatus.FAILED);
            operation.setCompletedAt(LocalDateTime.now());
            operation.setExecutionDurationMs(execDuration);
            operation.setFailureReason(e.getMessage());
            healingFailedCounter.increment();
            repository.save(operation);

            sendRemediationNotification(context.getPodName(), decision, "FAILED. Error: " + e.getMessage(), correlationId);
        }

        return decision;
    }

    private void sendRemediationNotification(String podName, AIHealingDecision decision, String status, String correlationId) {
        try {
            NotificationRequestDTO notification = new NotificationRequestDTO();
            notification.setRecipient("admin@aiops.com");
            notification.setSubject("AI Remediation Triggered: " + decision.getRecommendedAction());
            notification.setMessage(
                    "Correlation ID: " + correlationId + "\n" +
                    "AI Diagnosis: " + decision.getDiagnosis() + "\n" +
                    "Action Taken: " + decision.getRecommendedAction() + "\n" +
                    "Confidence Level: " + decision.getConfidence() + "\n" +
                    "Execution Result: " + status + "\n" +
                    "Timestamp: " + LocalDateTime.now()
            );
            notificationClient.sendNotification(notification);
        } catch (Exception e) {
            log.error("[CorrelationID: {}] Failed to dispatch remediation email notification: {}", correlationId, e.getMessage());
        }
    }

    private void triggerFeedbackLoop(String podName, String namespace, Long operationId, String correlationId) {
        int delay = policyProperties.getFeedbackDelaySeconds();
        log.info("[CorrelationID: {}] Starting background health check feedback loop. Cooldown: {} seconds", correlationId, delay);
        CompletableFuture.runAsync(() -> {
            try {
                TimeUnit.SECONDS.sleep(delay);
                log.info("[CorrelationID: {}] Cooldown finished. Checking health status of Pod: {}", correlationId, podName);
                
                HealingStatus healthStatus = healingExecutionService.checkPodHealth(podName, namespace);
                log.info("[CorrelationID: {}] Feedback Loop Result: Pod health status is {}.", correlationId, healthStatus);
                
                HealingOperation operation = repository.findById(operationId)
                        .orElseThrow(() -> new IllegalArgumentException("Operation ID not found: " + operationId));
                
                operation.setStatus(healthStatus);
                if (healthStatus == HealingStatus.FAILED) {
                    operation.setFailureReason("Pod did not return to healthy state within the cooldown period.");
                }
                
                repository.save(operation);
            } catch (InterruptedException ie) {
                log.error("[CorrelationID: {}] Feedback loop cooldown interrupted: {}", correlationId, ie.getMessage());
                Thread.currentThread().interrupt();
            } catch (Exception e) {
                log.error("[CorrelationID: {}] Failed to run feedback loop evaluation: {}", correlationId, e.getMessage());
            }
        });
    }
}