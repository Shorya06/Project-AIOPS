import React from "react";

export type ConfidenceType = "HIGH" | "MEDIUM" | "LOW" | string;

interface ConfidenceBadgeProps {
  score: ConfidenceType | number;
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({ score }) => {
  let label = "UNKNOWN";
  let variant: "success" | "warning" | "error" | "neutral" = "neutral";

  if (typeof score === "number") {
    label = `${(score * 100).toFixed(0)}%`;
    if (score >= 0.8) variant = "success";
    else if (score >= 0.5) variant = "warning";
    else variant = "error";
  } else {
    label = score.toUpperCase();
    if (label === "HIGH") variant = "success";
    else if (label === "MEDIUM") variant = "warning";
    else if (label === "LOW") variant = "error";
  }

  const styles = {
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    error: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    neutral: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border font-mono ${styles[variant]}`}>
      {label}
    </span>
  );
};
