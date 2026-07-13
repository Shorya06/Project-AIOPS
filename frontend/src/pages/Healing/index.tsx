import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { SectionCard } from "@/components/SectionCard";
import { HealingService } from "@/services/HealingService";
import { StatusTimeline } from "@/components/StatusTimeline";
import { ExecutionBadge } from "@/components/ExecutionBadge";
import { LoadingState } from "@/components/FeedbackStates";
import { HealingResponseDTO } from "@/types/api";
import { Info, XCircle, CheckCircle2 } from "lucide-react";

const STAGE_LABELS = [
  "Alert Ingestion",
  "Context Enrichment",
  "Gemini Analysis",
  "Policy Validation",
  "Mutation Execution",
  "Post-Verification Check",
];

const computeDuration = (op: HealingResponseDTO): string => {
  if (!op.startedAt || !op.completedAt) return "In progress";
  const start = new Date(op.startedAt).getTime();
  const end = new Date(op.completedAt).getTime();
  const diff = end - start;
  if (diff < 0) return "N/A";
  if (diff < 1000) return `${diff}ms`;
  return `${(diff / 1000).toFixed(2)}s`;
};

const getStageStatusLabel = (
  stageIndex: number,
  opStatus: HealingResponseDTO["status"]
): "Success" | "Failed" | "Pending" | "In Progress" => {
  if (opStatus === "SUCCESS") return "Success";
  if (opStatus === "FAILED") {
    return stageIndex === 5 ? "Failed" : "Success";
  }
  if (opStatus === "PENDING") {
    if (stageIndex < 4) return "Success";
    if (stageIndex === 4) return "In Progress";
    return "Pending";
  }
  return "Pending";
};

const getStageDetails = (
  stageIndex: number,
  op: HealingResponseDTO
): string => {
  switch (stageIndex) {
    case 0:
      return "Alertmanager webhook captured";
    case 1:
      return "Kubernetes pod metadata scraped";
    case 2:
      return op.reason || "Gemini analysis completed";
    case 3:
      return "Whitelist and confidence thresholds checked";
    case 4:
      return `Action type: ${op.action}`;
    case 5:
      return `Final status: ${op.status}`;
    default:
      return "";
  }
};

const HealingPage: React.FC = () => {
  const { data: operations, isLoading } = useQuery({
    queryKey: ["healingOperations"],
    queryFn: HealingService.getHealingOperations,
    refetchInterval: 15000,
  });

  const [selectedOp, setSelectedOp] = useState<HealingResponseDTO | null>(null);
  const [selectedStage, setSelectedStage] = useState<number | null>(null);

  if (isLoading) {
    return <LoadingState message="Syncing self-healing trace registry..." />;
  }

  // Default selection to the first operation
  const activeOp = selectedOp || (operations && operations.length > 0 ? operations[0] : null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Self-Healing Pipeline"
        description="Monitor automated cluster mutations, policy assertions, and liveness check loops."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Operations Ledger */}
        <div className="lg:col-span-2">
          <SectionCard
            title="Healing Operations Ledger"
            description="List of all cluster remediation events. Select an entry to audit its lifecycle trace."
          >
            <div className="overflow-x-auto">
              {operations && operations.length > 0 ? (
                <table className="w-full text-left border-collapse font-mono text-xs">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="py-3 px-2 font-bold uppercase">Pod Target</th>
                      <th className="py-3 px-2 font-bold uppercase">Remediation Action</th>
                      <th className="py-3 px-2 font-bold uppercase">Execution Status</th>
                      <th className="py-3 px-2 font-bold uppercase">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {operations.map((op) => {
                      const isSelected = activeOp?.id === op.id;
                      return (
                        <tr
                          key={op.id}
                          onClick={() => {
                            setSelectedOp(op);
                            setSelectedStage(null);
                          }}
                          className={`border-b border-border/45 hover:bg-muted/10 cursor-pointer transition-colors ${
                            isSelected ? "bg-primary/5 border-l-2 border-primary pl-1.5" : ""
                          }`}
                        >
                          <td className="py-3 px-2 font-semibold truncate max-w-[150px]">{op.podName}</td>
                          <td className="py-3 px-2 text-primary">{op.action}</td>
                          <td className="py-3 px-2">
                            <ExecutionBadge status={op.status} />
                          </td>
                          <td className="py-3 px-2 text-muted-foreground">
                            {new Date(op.startedAt).toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-12 text-muted-foreground text-xs italic">
                  No healing operations registered in the database logs.
                </div>
              )}
            </div>
          </SectionCard>
        </div>

        {/* Detailed Trace timeline stepper */}
        <div>
          <SectionCard
            title="Remediation Lifecycle Trace"
            description="Trace timeline of the selected operation."
          >
            {activeOp ? (
              <div className="space-y-6">
                
                {/* Stepper */}
                <StatusTimeline
                  status={activeOp.status}
                  action={activeOp.action}
                  selectedStage={selectedStage}
                  onStageClick={(idx) =>
                    setSelectedStage((prev) => (prev === idx ? null : idx))
                  }
                />

                {/* Stage Detail Panel */}
                {selectedStage !== null && (
                  <div className="p-4 rounded-lg bg-zinc-950/80 border border-emerald-500/20 space-y-3 font-mono text-xs animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <h4 className="text-zinc-200 font-bold text-xs">
                        {STAGE_LABELS[selectedStage]}
                      </h4>
                      {(() => {
                        const stageStatus = getStageStatusLabel(selectedStage, activeOp.status);
                        const colorMap = {
                          Success: "text-emerald-400",
                          Failed: "text-rose-400",
                          Pending: "text-zinc-500",
                          "In Progress": "text-amber-400",
                        };
                        const iconMap = {
                          Success: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
                          Failed: <XCircle className="w-3.5 h-3.5 text-rose-400" />,
                          Pending: <Info className="w-3.5 h-3.5 text-zinc-500" />,
                          "In Progress": <Info className="w-3.5 h-3.5 text-amber-400" />,
                        };
                        return (
                          <span className={`flex items-center gap-1.5 font-semibold ${colorMap[stageStatus]}`}>
                            {iconMap[stageStatus]}
                            {stageStatus}
                          </span>
                        );
                      })()}
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Timestamp</span>
                        <span className="text-zinc-300">
                          {activeOp.completedAt && getStageStatusLabel(selectedStage, activeOp.status) === "Success"
                            ? new Date(activeOp.completedAt).toLocaleString()
                            : new Date(activeOp.startedAt).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Duration</span>
                        <span className="text-zinc-300">
                          {activeOp.startedAt && activeOp.completedAt
                            ? computeDuration(activeOp)
                            : "In progress"}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-muted-foreground block mb-0.5">Details</span>
                      <p className="text-zinc-300 leading-relaxed">
                        {getStageDetails(selectedStage, activeOp)}
                      </p>
                    </div>

                    {activeOp.status === "FAILED" && selectedStage === 5 && activeOp.reason && (
                      <div className="p-2.5 rounded bg-rose-950/30 border border-rose-500/20">
                        <span className="text-[10px] text-rose-400 font-bold block mb-0.5">Failure Reason</span>
                        <p className="text-rose-300/90 text-[11px] leading-relaxed">{activeOp.reason}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Specs list */}
                <div className="border-t border-border pt-4 space-y-3 font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Namespace:</span>
                    <span className="text-zinc-300 font-semibold">{activeOp.namespace}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Execution Duration:</span>
                    <span className="text-zinc-300 font-semibold">
                      {computeDuration(activeOp)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Correlation ID:</span>
                    <span className="text-zinc-300 font-semibold truncate max-w-[150px]" title={activeOp.correlationId}>
                      {activeOp.correlationId
                        ? `${activeOp.correlationId.substring(0, 12)}...`
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Execution ID:</span>
                    <span className="text-zinc-300 font-semibold truncate max-w-[150px]" title={activeOp.executionId}>
                      {activeOp.executionId
                        ? `${activeOp.executionId.substring(0, 12)}...`
                        : "N/A"}
                    </span>
                  </div>
                </div>

              </div>
            ) : (
              <div className="text-center py-12 text-zinc-500 font-mono text-xs italic">
                Select an operation from the ledger to view its SRE pipeline trace.
              </div>
            )}
          </SectionCard>
        </div>

      </div>
    </div>
  );
};

export default HealingPage;
