import React from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info } from "lucide-react";

export type StatusType = "healthy" | "warning" | "error" | "info" | "neutral";

interface StatusCardProps {
  title: string;
  status: string;
  type?: StatusType;
  details?: string;
  className?: string;
}

export const StatusCard: React.FC<StatusCardProps> = ({
  title,
  status,
  type = "neutral",
  details,
  className = "",
}) => {
  const styles = {
    healthy: {
      border: "border-emerald-500/20 bg-emerald-500/5",
      text: "text-emerald-400",
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
    },
    warning: {
      border: "border-amber-500/20 bg-amber-500/5",
      text: "text-amber-400",
      icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
    },
    error: {
      border: "border-rose-500/20 bg-rose-500/5",
      text: "text-rose-400",
      icon: <XCircle className="w-5 h-5 text-rose-400" />,
    },
    info: {
      border: "border-sky-500/20 bg-sky-500/5",
      text: "text-sky-400",
      icon: <Info className="w-5 h-5 text-sky-400" />,
    },
    neutral: {
      border: "border-border bg-card",
      text: "text-foreground",
      icon: <Info className="w-5 h-5 text-muted-foreground" />,
    },
  };

  const activeStyle = styles[type];

  return (
    <div className={`border rounded-lg p-5 flex items-start gap-4 shadow-sm transition-all ${activeStyle.border} ${className}`}>
      <div className="mt-0.5">{activeStyle.icon}</div>
      <div className="flex-1">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h4>
        <div className={`text-lg font-bold font-mono mt-1 ${activeStyle.text}`}>{status}</div>
        {details && <p className="text-xs text-muted-foreground mt-1">{details}</p>}
      </div>
    </div>
  );
};
