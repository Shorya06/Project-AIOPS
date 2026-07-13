import React from "react";
import { HealingStatus } from "@/types/api";

interface ExecutionBadgeProps {
  status: HealingStatus;
}

export const ExecutionBadge: React.FC<ExecutionBadgeProps> = ({ status }) => {
  const styles = {
    SUCCESS: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    PENDING: "bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse",
    FAILED: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    PARTIAL: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  };

  const activeStyle = styles[status] || "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border font-mono ${activeStyle}`}>
      {status}
    </span>
  );
};
