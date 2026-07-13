import React from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: {
    value: string | number;
    direction: "up" | "down";
    label?: string;
  };
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  trend,
  className = "",
}) => {
  return (
    <div className={`bg-card text-card-foreground border border-border rounded-lg p-5 shadow-sm ${className}`}>
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h4>
      <div className="flex items-baseline gap-1 mt-2">
        <span className="text-2xl font-bold font-mono text-foreground">{value}</span>
        {unit && <span className="text-sm font-medium text-muted-foreground ml-1">{unit}</span>}
      </div>
      {trend && (
        <div className="flex items-center gap-1 mt-2.5">
          <span
            className={`inline-flex items-center text-xs font-medium ${
              trend.direction === "up" ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {trend.direction === "up" ? (
              <ArrowUpRight className="w-3 h-3 mr-0.5" />
            ) : (
              <ArrowDownRight className="w-3 h-3 mr-0.5" />
            )}
            {trend.value}
          </span>
          {trend.label && <span className="text-xs text-muted-foreground">{trend.label}</span>}
        </div>
      )}
    </div>
  );
};
