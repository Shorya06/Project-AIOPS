import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { SectionCard } from "@/components/SectionCard";
import { StatusCard } from "@/components/StatusCard";
import { HealingService } from "@/services/HealingService";
import { ConfidenceBadge } from "@/components/ConfidenceBadge";
import { AlertCircle, Copy, Check, ChevronRight } from "lucide-react";
import { LoadingState } from "@/components/FeedbackStates";
import { AIAnalysisRecord } from "@/types/api";

const CollapsibleSection: React.FC<{
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}> = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="space-y-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 group cursor-pointer"
      >
        <ChevronRight
          className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${
            isOpen ? "rotate-90" : ""
          }`}
        />
        <span className="text-[10px] font-bold text-muted-foreground uppercase font-mono tracking-wider group-hover:text-zinc-300 transition-colors">
          {title}
        </span>
      </button>
      {isOpen && <>{children}</>}
    </div>
  );
};

const AIPage: React.FC = () => {
  const { data: operations, isLoading: isLoadingOps } = useQuery({
    queryKey: ["healingOperations"],
    queryFn: HealingService.getHealingOperations,
  });

  const { data: analysisRecords, isLoading: isLoadingRecords, error: historyError } = useQuery({
    queryKey: ["aiAnalysisRecords"],
    queryFn: HealingService.getAIAnalysisRecords,
    retry: 1,
  });

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<AIAnalysisRecord | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const isLoading = isLoadingOps || isLoadingRecords;

  if (isLoading) {
    return <LoadingState message="Syncing AI diagnoses logs..." />;
  }

  // Fallback to latest operations if no analysis history is returned
  const fallbackOp = operations?.find((op) => op.reason);

  const activeRecord = selectedRecord || (analysisRecords && analysisRecords.length > 0 ? analysisRecords[0] : null);

  const formatTimestamp = (ts: string) => {
    try {
      return new Date(ts).toLocaleString();
    } catch {
      return ts;
    }
  };

  return (
    <div>
      <PageHeader
        title="AI Diagnosis Registry"
        description="Gemini-derived root cause analysis logs, context reasoning, and confidence ratios."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <StatusCard
          title="LLM Provider Engine"
          status={activeRecord?.geminiModel || "gemini-3.5-flash"}
          type="info"
          details={`Prompt version: ${activeRecord?.promptVersion || "1.0.0"}`}
        />
        <StatusCard
          title="Scrape Confidence"
          status={activeRecord ? `${activeRecord.confidence} Score` : "94% (High)"}
          type="healthy"
          details="Remediation whitelisted"
        />
        <StatusCard
          title="Analysis Duration"
          status={activeRecord?.executionDurationMs ? `${activeRecord.executionDurationMs} ms` : "N/A"}
          type="info"
          details="Token completion latency"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Latest Gemini Diagnosis Detail */}
        <div className="lg:col-span-2 space-y-6">
          <SectionCard
            title={activeRecord ? "Selected Analysis Report" : "Latest Gemini Diagnosis"}
            description="Structured explanation generated for the cluster incident."
          >
            {activeRecord ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4 bg-muted/40 p-3 rounded border border-border/80 text-xs font-mono text-zinc-300">
                  <div className="flex gap-4">
                    <div>
                      <span className="text-muted-foreground mr-1">Correlation:</span>
                      <span className="text-primary truncate max-w-[100px] inline-block align-middle" title={activeRecord.correlationId}>
                        {activeRecord.correlationId.substring(0, 8)}...
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground mr-1">Recommended Action:</span>
                      <span className="text-emerald-400 font-semibold">{activeRecord.recommendedAction}</span>
                    </div>
                  </div>
                  <ConfidenceBadge score={activeRecord.confidence} />
                </div>

                {/* Diagnosis */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase font-mono tracking-wider">Diagnosis</span>
                  <div className="p-4 rounded-lg bg-zinc-950/80 border border-border text-xs font-mono text-zinc-300 select-text leading-relaxed">
                    {activeRecord.diagnosis}
                  </div>
                </div>

                {/* Reasoning */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase font-mono tracking-wider">Reasoning</span>
                  <div className="relative p-4 rounded-lg bg-zinc-950 border border-border text-xs font-mono text-zinc-300 select-text leading-relaxed whitespace-pre-wrap">
                    <div className="absolute top-3 right-3">
                      <button
                        onClick={() => handleCopy(activeRecord.reasoning, "reasoning")}
                        className="p-1 rounded hover:bg-zinc-800 text-muted-foreground hover:text-foreground transition-colors"
                        title="Copy Reasoning"
                      >
                        {copiedId === "reasoning" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    {activeRecord.reasoning}
                  </div>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3 p-4 rounded-lg bg-zinc-950/60 border border-border font-mono text-xs">
                  <div>
                    <span className="text-[10px] text-muted-foreground block mb-0.5">Prompt Version</span>
                    <span className="text-zinc-300 font-semibold">{activeRecord.promptVersion || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block mb-0.5">Model</span>
                    <span className="text-zinc-300 font-semibold">{activeRecord.geminiModel || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block mb-0.5">Duration</span>
                    <span className="text-zinc-300 font-semibold">
                      {activeRecord.executionDurationMs ? `${activeRecord.executionDurationMs}ms` : "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block mb-0.5">Confidence</span>
                    <span className="text-zinc-300 font-semibold">{activeRecord.confidence}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block mb-0.5">Action</span>
                    <span className="text-emerald-400 font-semibold">{activeRecord.recommendedAction}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block mb-0.5">Timestamp</span>
                    <span className="text-zinc-300 font-semibold">{formatTimestamp(activeRecord.timestamp)}</span>
                  </div>
                </div>

                {/* Extended Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 p-4 rounded-lg bg-zinc-950/40 border border-border/60 font-mono text-xs">
                  <div>
                    <span className="text-[10px] text-muted-foreground block mb-0.5">Preventive Recommendation</span>
                    <span className="text-zinc-300 leading-relaxed">
                      {activeRecord.validatedRecommendationSnapshot || "Not available"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block mb-0.5">Action Parameters</span>
                    <span className="text-zinc-400 italic">See healing operation record</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block mb-0.5">Validation Result</span>
                    <span className="text-zinc-300">
                      {activeRecord.validatedRecommendationSnapshot ? "Validated" : "Pending validation"}
                    </span>
                  </div>
                </div>

                {/* Collapsible: Prompt */}
                {activeRecord.prompt && (
                  <CollapsibleSection title="Prompt Sent to LLM">
                    <div className="relative p-4 rounded-lg bg-zinc-950 border border-border text-[11px] font-mono text-zinc-400 whitespace-pre-wrap overflow-x-auto max-h-[200px] leading-relaxed select-text">
                      <div className="absolute top-3 right-3">
                        <button
                          onClick={() => handleCopy(activeRecord.prompt, "prompt")}
                          className="p-1 rounded hover:bg-zinc-800 text-muted-foreground hover:text-foreground transition-colors"
                          title="Copy Prompt"
                        >
                          {copiedId === "prompt" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      {activeRecord.prompt}
                    </div>
                  </CollapsibleSection>
                )}

                {/* Collapsible: Raw Response */}
                {activeRecord.rawGeminiResponse && (
                  <CollapsibleSection title="Raw LLM Response">
                    <pre className="p-4 rounded-lg bg-zinc-950/60 border border-border text-[11px] font-mono text-emerald-400/90 overflow-x-auto max-h-[160px] leading-relaxed">
                      {activeRecord.rawGeminiResponse}
                    </pre>
                  </CollapsibleSection>
                )}
              </div>
            ) : fallbackOp ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-4 bg-muted/40 p-3 rounded border border-border/80 text-xs font-mono text-zinc-300">
                  <div>
                    <span className="text-muted-foreground mr-1">Pod Target:</span>
                    <span className="text-primary">{fallbackOp.podName}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground mr-1">Remediation Action:</span>
                    <span className="text-emerald-400">{fallbackOp.action}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground mr-1">Execution Status:</span>
                    <span className="text-zinc-300">{fallbackOp.status}</span>
                  </div>
                </div>

                <div className="relative bg-zinc-950 p-5 rounded-lg border border-border font-mono text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed select-text">
                  <div className="absolute top-3 right-3">
                    <button
                      onClick={() => handleCopy(fallbackOp.reason || "", "fallback")}
                      className="p-1.5 rounded hover:bg-zinc-800 text-muted-foreground hover:text-foreground transition-colors"
                      title="Copy Diagnosis"
                    >
                      {copiedId === "fallback" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {fallbackOp.reason}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground text-xs italic">
                No active diagnoses logs registered in the operations history.
              </div>
            )}
          </SectionCard>
        </div>

        {/* Diagnosis History Sidebar */}
        <div>
          <SectionCard title="Diagnosis History Feed" description="Archived root-cause reports history.">
            {historyError ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-500 font-mono text-xs border border-dashed border-border rounded-lg bg-zinc-950/20">
                <AlertCircle className="w-8 h-8 mb-2 text-zinc-600" />
                <span className="font-semibold text-zinc-400 uppercase tracking-wider">Diagnosis history unavailable</span>
                <p className="text-[10px] text-muted-foreground mt-2 max-w-[200px] leading-relaxed">
                  GET controller endpoint for AIAnalysisRecord database history is not exposed in the API gateway.
                </p>
              </div>
            ) : analysisRecords && analysisRecords.length > 0 ? (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                {analysisRecords.map((rec) => {
                  const isSelected = activeRecord?.id === rec.id;
                  return (
                    <div
                      key={rec.id}
                      onClick={() => setSelectedRecord(rec)}
                      className={`p-3 border rounded font-mono text-xs space-y-2 cursor-pointer transition-all hover:bg-muted/20 ${
                        isSelected ? "bg-primary/5 border-primary" : "border-border/60 bg-zinc-950/10"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-primary">{rec.recommendedAction}</span>
                        <ConfidenceBadge score={rec.confidence} />
                      </div>
                      <p className="text-zinc-300 text-[11px] leading-relaxed line-clamp-2">{rec.diagnosis}</p>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/40">
                        <span>{new Date(rec.timestamp).toLocaleTimeString()}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(rec.correlationId, rec.correlationId);
                          }}
                          className="hover:text-foreground flex items-center gap-1 font-semibold"
                          title="Copy Correlation ID"
                        >
                          {copiedId === rec.correlationId ? "Copied" : "Copy ID"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground text-xs italic">
                No archived diagnosis records found.
              </div>
            )}
          </SectionCard>
        </div>

      </div>
    </div>
  );
};

export default AIPage;
