import React from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { SectionCard } from "@/components/SectionCard";
import { ObserverService } from "@/services/ObserverService";
import { StatusBadge } from "@/components/StatusBadge";
import { LoadingState } from "@/components/FeedbackStates";
import { AlertCircle, AlertTriangle } from "lucide-react";

const AlertsPage: React.FC = () => {
  const { data: alerts, isLoading, error } = useQuery({
    queryKey: ["activeAlerts"],
    queryFn: ObserverService.getActiveAlerts,
    refetchInterval: 10000, // Refresh alert feed every 10 seconds
    retry: 1,
  });

  if (isLoading) {
    return <LoadingState message="Syncing Alertmanager alarms..." />;
  }

  return (
    <div>
      <PageHeader
        title="Alarms & Incidents Feed"
        description="Alertmanager and Prometheus active incident notifications tracker."
      />

      <SectionCard title="Active Alarms Console" description="Real-time alarm events matching Alertmanager configurations.">
        {error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-zinc-500 font-mono text-xs border border-dashed border-border rounded-lg bg-zinc-950/20">
            <AlertCircle className="w-8 h-8 mb-2 text-zinc-600" />
            <span className="font-semibold text-zinc-400 uppercase tracking-wider">Alert feed unavailable</span>
            <p className="text-[10px] text-muted-foreground mt-2 max-w-md leading-relaxed">
              No alert logging query controller is active inside the k8s-observer-service module, or exposed inside the API gateway.
            </p>
          </div>
        ) : alerts && alerts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground font-semibold">
                  <th className="py-3 px-2 uppercase">Severity</th>
                  <th className="py-3 px-2 uppercase">Alert</th>
                  <th className="py-3 px-2 uppercase">Namespace</th>
                  <th className="py-3 px-2 uppercase">Pod Target</th>
                  <th className="py-3 px-2 uppercase">Starts At</th>
                  <th className="py-3 px-2 uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((al, idx) => (
                  <tr key={idx} className="border-b border-border/40 hover:bg-muted/10">
                    <td className="py-3 px-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                          al.labels.severity === "critical"
                            ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                            : al.labels.severity === "warning"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                        }`}
                      >
                        {al.labels.severity}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-primary font-semibold">{al.labels.alertname}</td>
                    <td className="py-3 px-2 text-zinc-300">{al.labels.namespace}</td>
                    <td className="py-3 px-2 text-zinc-300 truncate max-w-[120px]" title={al.labels.pod}>
                      {al.labels.pod}
                    </td>
                    <td className="py-3 px-2 text-muted-foreground">
                      {new Date(al.startsAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-2">
                      <StatusBadge label={al.status} variant={al.status === "firing" ? "error" : "neutral"} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center text-zinc-500 font-mono text-xs">
            <AlertTriangle className="w-8 h-8 mb-2 text-zinc-600" />
            <span className="font-semibold text-zinc-400 uppercase tracking-wider text-zinc-400">No Active Alarms</span>
            <p className="text-[10px] text-muted-foreground mt-2 max-w-xs leading-relaxed">
              No anomaly metrics exceed configured thresholds in the Prometheus scraper metrics.
            </p>
          </div>
        )}
      </SectionCard>
    </div>
  );
};

export default AlertsPage;
