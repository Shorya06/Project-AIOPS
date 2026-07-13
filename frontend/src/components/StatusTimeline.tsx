import React from "react";
import { CheckCircle2, AlertCircle, Loader2, Circle } from "lucide-react";
import { HealingStatus } from "@/types/api";

interface StatusTimelineProps {
  status: HealingStatus;
  action: string;
  selectedStage?: number | null;
  onStageClick?: (index: number) => void;
}

export const StatusTimeline: React.FC<StatusTimelineProps> = ({
  status,
  action,
  selectedStage,
  onStageClick,
}) => {
  const steps = [
    { label: "Alert Ingestion", desc: "Alertmanager webhook trigger captured" },
    { label: "Context Enrichment", desc: "Scraped Kubernetes pod logs & events details" },
    { label: "Gemini Analysis", desc: "Parsed crash logs via gemini-3.5-flash" },
    { label: "Policy Validation", desc: "Checked whitelists, confidences & safety constraints" },
    { label: "Mutation Execution", desc: `Dispatched K8s patch: ${action}` },
    { label: "Post-Verification Check", desc: "Observed container startup health lifecycle loops" },
  ];

  const getStepStatus = (index: number) => {
    if (status === "SUCCESS") {
      return {
        icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
        textClass: "text-zinc-200"
      };
    }
    if (status === "FAILED") {
      if (index === 5) {
        return {
          icon: <AlertCircle className="w-5 h-5 text-rose-400" />,
          textClass: "text-rose-400/90"
        };
      }
      return {
        icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
        textClass: "text-zinc-200"
      };
    }
    if (status === "PENDING") {
      if (index < 4) {
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
          textClass: "text-zinc-200"
        };
      }
      if (index === 4) {
        return {
          icon: <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />,
          textClass: "text-zinc-300 animate-pulse"
        };
      }
      return {
        icon: <Circle className="w-5 h-5 text-zinc-600" />,
        textClass: "text-zinc-500"
      };
    }
    return {
      icon: <Circle className="w-5 h-5 text-zinc-600" />,
      textClass: "text-zinc-500"
    };
  };

  return (
    <div className="relative border-l border-border pl-6 space-y-6">
      {steps.map((step, idx) => {
        const stepState = getStepStatus(idx);
        const isSelected = selectedStage === idx;
        return (
          <div
            key={idx}
            className={`relative rounded-md px-2 py-1.5 -ml-2 transition-all ${
              onStageClick ? "cursor-pointer hover:bg-muted/20" : ""
            } ${
              isSelected
                ? "bg-primary/5 ring-1 ring-emerald-500/60 border border-emerald-500/30"
                : ""
            }`}
            onClick={() => onStageClick?.(idx)}
          >
            <div className="absolute -left-[29px] mt-0.5 bg-background p-0.5 rounded-full z-10">
              {stepState.icon}
            </div>
            <div>
              <h5 className={`text-xs font-semibold font-mono ${stepState.textClass}`}>
                {step.label}
              </h5>
              <p className="text-[11px] text-muted-foreground mt-0.5">{step.desc}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
export default StatusTimeline;
