import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { SectionCard } from "@/components/SectionCard";
import { HealingService } from "@/services/HealingService";
import { ExecutionBadge } from "@/components/ExecutionBadge";
import { ConfidenceBadge } from "@/components/ConfidenceBadge";
import { LoadingState } from "@/components/FeedbackStates";
import { AIAnalysisRecord, HealingResponseDTO } from "@/types/api";
import { AlertCircle, Search, Download, X, ChevronDown, ChevronRight } from "lucide-react";

// Extended audit row that carries the full matched analysis record
interface AuditRow extends HealingResponseDTO {
  confidence: string;
  diagnosis: string;
  durationMs: number;
  analysisRecord?: AIAnalysisRecord;
}

// ─── Drawer Field Component ────────────────────────────────────────────────────
const DrawerField: React.FC<{ label: string; value?: string | number | null; mono?: boolean }> = ({
  label,
  value,
  mono = true,
}) => (
  <div className="space-y-1">
    <span className="block uppercase text-[10px] text-muted-foreground font-semibold tracking-wider">
      {label}
    </span>
    <span className={`block text-xs text-zinc-300 break-all ${mono ? "font-mono" : ""}`}>
      {value !== undefined && value !== null && value !== "" ? String(value) : "N/A"}
    </span>
  </div>
);

// ─── Collapsible Section Component ─────────────────────────────────────────────
const CollapsibleSection: React.FC<{ label: string; content?: string }> = ({ label, content }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-border rounded-md overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 bg-muted/20 hover:bg-muted/30 transition-colors text-left"
      >
        <span className="uppercase text-[10px] text-muted-foreground font-semibold tracking-wider">
          {label}
        </span>
        {open ? (
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
        )}
      </button>
      {open && (
        <div className="px-3 py-2 bg-zinc-950/30 max-h-60 overflow-y-auto">
          <pre className="text-xs text-zinc-400 font-mono whitespace-pre-wrap break-all leading-relaxed">
            {content || "N/A"}
          </pre>
        </div>
      )}
    </div>
  );
};

// ─── Audit Detail Drawer ───────────────────────────────────────────────────────
const AuditDrawer: React.FC<{ audit: AuditRow | null; onClose: () => void }> = ({
  audit,
  onClose,
}) => {
  const isOpen = audit !== null;
  const rec = audit?.analysisRecord;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-lg bg-card border-l border-border shadow-2xl transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {audit && (
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/10">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Audit Record Detail</h3>
                <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                  {audit.executionId || "No Execution ID"}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-md hover:bg-muted/30 transition-colors text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
              {/* Execution Info */}
              <div className="grid grid-cols-2 gap-4">
                <DrawerField label="Execution ID" value={audit.executionId} />
                <DrawerField label="Correlation ID" value={audit.correlationId} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <DrawerField label="Pod" value={audit.podName} />
                <DrawerField label="Namespace" value={audit.namespace} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <DrawerField label="Action" value={audit.action} />
                <div className="space-y-1">
                  <span className="block uppercase text-[10px] text-muted-foreground font-semibold tracking-wider">
                    Status
                  </span>
                  <ExecutionBadge status={audit.status} />
                </div>
              </div>

              <div className="border-t border-border/40 my-2" />

              {/* AI Analysis Info */}
              <DrawerField label="Diagnosis" value={rec?.diagnosis ?? audit.diagnosis} />
              <DrawerField label="Reasoning" value={rec?.reasoning} />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="block uppercase text-[10px] text-muted-foreground font-semibold tracking-wider">
                    Confidence
                  </span>
                  {rec ? (
                    <ConfidenceBadge score={rec.confidence} />
                  ) : (
                    <span className="text-xs text-zinc-500 font-mono">N/A</span>
                  )}
                </div>
                <DrawerField
                  label="Execution Duration"
                  value={rec?.executionDurationMs ? `${rec.executionDurationMs}ms` : undefined}
                />
              </div>

              <DrawerField label="Recommended Action" value={rec?.recommendedAction} />
              <DrawerField
                label="Validation Result"
                value={rec?.validatedRecommendationSnapshot}
              />

              <div className="border-t border-border/40 my-2" />

              {/* Collapsible Raw Sections */}
              <CollapsibleSection label="Raw Gemini Response" content={rec?.rawGeminiResponse} />
              <CollapsibleSection label="Prompt" content={rec?.prompt} />

              <div className="border-t border-border/40 my-2" />

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-4">
                <DrawerField label="Started At" value={audit.startedAt} />
                <DrawerField label="Completed At" value={audit.completedAt} />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

// ─── Audit Page ────────────────────────────────────────────────────────────────
const AuditPage: React.FC = () => {
  const [search, setSearch] = useState("");
  const [selectedAudit, setSelectedAudit] = useState<AuditRow | null>(null);

  const { data: operations, isLoading: isLoadingOps } = useQuery({
    queryKey: ["healingOperations"],
    queryFn: HealingService.getHealingOperations,
  });

  const { data: analysisRecords, isLoading: isLoadingAnalyses } = useQuery({
    queryKey: ["aiAnalysisRecords"],
    queryFn: HealingService.getAIAnalysisRecords,
  });

  // Client-side correlation join — now also carries the full matched analysis record
  const audits = useMemo<AuditRow[]>(() => {
    if (!operations) return [];
    return operations.map((op) => {
      const match = analysisRecords?.find((rec) => rec.correlationId === op.correlationId);
      return {
        ...op,
        confidence: match ? match.confidence : "N/A",
        diagnosis: match ? match.diagnosis : (op.reason || "N/A"),
        durationMs: match ? match.executionDurationMs ?? 0 : 0,
        analysisRecord: match,
      };
    });
  }, [operations, analysisRecords]);

  const filteredAudits = useMemo(() => {
    return audits.filter((audit) => {
      if (!search) return true;
      return (
        (audit.correlationId && audit.correlationId.toLowerCase().includes(search.toLowerCase())) ||
        (audit.podName && audit.podName.toLowerCase().includes(search.toLowerCase()))
      );
    });
  }, [audits, search]);

  const isLoading = isLoadingOps || isLoadingAnalyses;

  if (isLoading) {
    return <LoadingState message="Syncing transaction audits ledger..." />;
  }

  return (
    <div>
      <PageHeader
        title="System Tracing Ledger"
        description="Audit historical execution logs, Gemini response snapshots, and cluster remediation runs."
        actions={
          <button
            className="inline-flex items-center px-3 py-1.5 border border-border bg-card hover:bg-muted text-xs font-semibold rounded-md text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 cursor-not-allowed"
            disabled
          >
            <Download className="w-3.5 h-3.5 mr-2" />
            Export CSV
          </button>
        }
      />

      <SectionCard title="System Audits Console" description="Full database transaction tracing index.">
        <div className="space-y-6">
          
          {/* Filters Bar */}
          <div className="flex items-center gap-4 border border-border bg-muted/20 p-3 rounded-lg">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by Correlation ID or Pod..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-border bg-background rounded-md text-xs font-mono focus:ring-1 focus:ring-ring outline-none"
              />
            </div>
            <span className="text-xs text-muted-foreground font-mono">
              Filters active: {search ? "Search active" : "None"}
            </span>
          </div>

          {filteredAudits.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-mono text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground font-semibold">
                    <th className="py-3 px-2 uppercase">Execution ID</th>
                    <th className="py-3 px-2 uppercase">Correlation ID</th>
                    <th className="py-3 px-2 uppercase">Pod Target</th>
                    <th className="py-3 px-2 uppercase">Diagnosis</th>
                    <th className="py-3 px-2 uppercase">Action</th>
                    <th className="py-3 px-2 uppercase">Confidence</th>
                    <th className="py-3 px-2 uppercase">Status</th>
                    <th className="py-3 px-2 uppercase">AI Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAudits.map((aud) => (
                    <tr
                      key={aud.id}
                      className="border-b border-border/40 hover:bg-muted/10 cursor-pointer transition-colors"
                      onClick={() => setSelectedAudit(aud)}
                    >
                      <td
                        className="py-3 px-2 text-primary font-semibold truncate max-w-[80px]"
                        title={aud.executionId}
                      >
                        {aud.executionId ? aud.executionId.substring(0, 8) : "N/A"}
                      </td>
                      <td
                        className="py-3 px-2 text-zinc-300 truncate max-w-[80px]"
                        title={aud.correlationId}
                      >
                        {aud.correlationId ? aud.correlationId.substring(0, 8) : "N/A"}
                      </td>
                      <td
                        className="py-3 px-2 text-zinc-300 truncate max-w-[120px]"
                        title={aud.podName}
                      >
                        {aud.podName}
                      </td>
                      <td
                        className="py-3 px-2 text-zinc-400 truncate max-w-[180px]"
                        title={aud.diagnosis}
                      >
                        {aud.diagnosis}
                      </td>
                      <td className="py-3 px-2 text-primary">{aud.action}</td>
                      <td className="py-3 px-2">
                        {aud.confidence !== "N/A" ? (
                          <ConfidenceBadge score={aud.confidence} />
                        ) : (
                          <span className="text-zinc-500">N/A</span>
                        )}
                      </td>
                      <td className="py-3 px-2">
                        <ExecutionBadge status={aud.status} />
                      </td>
                      <td className="py-3 px-2 text-muted-foreground font-mono">
                        {aud.durationMs ? `${aud.durationMs}ms` : "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center text-zinc-500 font-mono text-xs border border-dashed border-border rounded-lg bg-zinc-950/20">
              <AlertCircle className="w-8 h-8 mb-2 text-zinc-600" />
              <span className="font-semibold text-zinc-400 uppercase tracking-wider">No Audits Registered</span>
              <p className="text-[10px] text-muted-foreground mt-2 max-w-md leading-relaxed">
                No self-healing operations have been logged. Trigger an OOM fault on the transaction service to test.
              </p>
            </div>
          )}

        </div>
      </SectionCard>

      {/* Side Drawer */}
      <AuditDrawer audit={selectedAudit} onClose={() => setSelectedAudit(null)} />
    </div>
  );
};

export default AuditPage;
