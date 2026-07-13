import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { SectionCard } from "@/components/SectionCard";
import { ObserverService } from "@/services/ObserverService";
import { LoadingState } from "@/components/FeedbackStates";
import {
  AlertCircle,
  Terminal,
  Eye,
  RotateCw,
  Trash2,
  Search,
  ChevronDown,
  Box,
  Layers,
  Network,
  FolderOpen,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type TabKey = "pods" | "deployments" | "services" | "namespaces";

const TAB_CONFIG: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: "pods", label: "Pods", icon: Box },
  { key: "deployments", label: "Deployments", icon: Layers },
  { key: "services", label: "Services", icon: Network },
  { key: "namespaces", label: "Namespaces", icon: FolderOpen },
];

/** Returns tailwind classes for pod status badges */
const getStatusStyles = (status: string): string => {
  const s = status.toLowerCase();
  if (s === "running" || s === "succeeded")
    return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
  if (s === "pending" || s === "containercreating")
    return "bg-amber-500/10 text-amber-400 border-amber-500/30";
  if (s === "failed" || s === "error" || s === "crashloopbackoff")
    return "bg-rose-500/10 text-rose-400 border-rose-500/30";
  return "bg-zinc-500/10 text-zinc-400 border-zinc-500/30";
};

/** Returns the status dot color */
const getStatusDot = (status: string): string => {
  const s = status.toLowerCase();
  if (s === "running" || s === "succeeded") return "bg-emerald-400";
  if (s === "pending" || s === "containercreating") return "bg-amber-400";
  if (s === "failed" || s === "error" || s === "crashloopbackoff") return "bg-rose-400";
  return "bg-zinc-400";
};

const KubernetesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>("pods");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNamespace, setSelectedNamespace] = useState<string>("all");

  const { data: telemetry, isLoading, error } = useQuery({
    queryKey: ["clusterTelemetry"],
    queryFn: ObserverService.getClusterTelemetry,
    refetchInterval: 15000,
    retry: 1,
  });

  // Filtered pods based on search + namespace
  const filteredPods = useMemo(() => {
    if (!telemetry?.pods) return [];
    return telemetry.pods.filter((pod) => {
      const matchesSearch =
        searchQuery === "" ||
        pod.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesNamespace =
        selectedNamespace === "all" || pod.namespace === selectedNamespace;
      return matchesSearch && matchesNamespace;
    });
  }, [telemetry?.pods, searchQuery, selectedNamespace]);

  // Status summary counts
  const statusSummary = useMemo(() => {
    if (!telemetry?.pods) return { running: 0, pending: 0, failed: 0, total: 0 };
    const running = telemetry.pods.filter(
      (p) => p.status.toLowerCase() === "running" || p.status.toLowerCase() === "succeeded"
    ).length;
    const pending = telemetry.pods.filter(
      (p) => p.status.toLowerCase() === "pending" || p.status.toLowerCase() === "containercreating"
    ).length;
    const failed = telemetry.pods.filter(
      (p) =>
        p.status.toLowerCase() === "failed" ||
        p.status.toLowerCase() === "error" ||
        p.status.toLowerCase() === "crashloopbackoff"
    ).length;
    return { running, pending, failed, total: telemetry.pods.length };
  }, [telemetry?.pods]);

  if (isLoading) {
    return <LoadingState message="Syncing Kubernetes cluster telemetry..." />;
  }

  const isOffline = error || !telemetry || telemetry.status !== "ONLINE";

  const getTabCount = (key: TabKey): number => {
    if (!telemetry) return 0;
    switch (key) {
      case "pods": return telemetry.pods.length;
      case "deployments": return telemetry.deployments.length;
      case "services": return telemetry.services.length;
      case "namespaces": return telemetry.namespaces.length;
    }
  };

  return (
    <div>
      <PageHeader
        title="Kubernetes Resources"
        description="Kubernetes clusters, nodes, pods, and container workloads monitoring."
      />

      <SectionCard
        title="Kubernetes Cluster Workloads"
        description="Active pods, replica counts, and deployment logs controller."
      >
        <div className="space-y-6">
          {/* Action buttons (Disabled) */}
          <div className="flex flex-wrap items-center gap-3 bg-muted/20 p-3 rounded-lg border border-border">
            <button
              className="inline-flex items-center px-3 py-1.5 border border-border bg-card text-xs font-semibold rounded text-muted-foreground opacity-50 cursor-not-allowed"
              disabled
            >
              <Eye className="w-3.5 h-3.5 mr-2" />
              View Logs
            </button>
            <button
              className="inline-flex items-center px-3 py-1.5 border border-border bg-card text-xs font-semibold rounded text-muted-foreground opacity-50 cursor-not-allowed"
              disabled
            >
              <Terminal className="w-3.5 h-3.5 mr-2" />
              Describe Pod
            </button>
            <button
              className="inline-flex items-center px-3 py-1.5 border border-border bg-card text-xs font-semibold rounded text-muted-foreground opacity-50 cursor-not-allowed"
              disabled
            >
              <RotateCw className="w-3.5 h-3.5 mr-2" />
              Restart Deployment
            </button>
            <button
              className="inline-flex items-center px-3 py-1.5 border border-rose-500/20 bg-card text-xs font-semibold rounded text-rose-500/40 opacity-50 cursor-not-allowed"
              disabled
            >
              <Trash2 className="w-3.5 h-3.5 mr-2" />
              Delete Pod
            </button>
          </div>

          {isOffline ? (
            <div className="flex flex-col items-center justify-center py-20 text-center text-zinc-500 font-mono text-xs border border-dashed border-border rounded-lg bg-zinc-950/20">
              <AlertCircle className="w-8 h-8 mb-2 text-zinc-600" />
              <span className="font-semibold text-zinc-400 uppercase tracking-wider">
                Cluster telemetry endpoint unavailable
              </span>
              <p className="text-[10px] text-muted-foreground mt-2 max-w-md leading-relaxed">
                No Kubernetes monitoring controller is exposed in the gateway routes to query live
                pods or namespaces workloads.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Status Summary Bar */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-zinc-950/40">
                  <div className="w-2 h-2 rounded-full bg-foreground" />
                  <div className="font-mono">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Pods</p>
                    <p className="text-lg font-bold text-foreground">{statusSummary.total}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <div className="font-mono">
                    <p className="text-[10px] text-emerald-400/80 uppercase tracking-wider">Running</p>
                    <p className="text-lg font-bold text-emerald-400">{statusSummary.running}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg border border-amber-500/20 bg-amber-500/5">
                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                  <div className="font-mono">
                    <p className="text-[10px] text-amber-400/80 uppercase tracking-wider">Pending</p>
                    <p className="text-lg font-bold text-amber-400">{statusSummary.pending}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg border border-rose-500/20 bg-rose-500/5">
                  <div className="w-2 h-2 rounded-full bg-rose-400" />
                  <div className="font-mono">
                    <p className="text-[10px] text-rose-400/80 uppercase tracking-wider">Failed</p>
                    <p className="text-lg font-bold text-rose-400">{statusSummary.failed}</p>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-1 border-b border-border/60 pb-0 font-mono text-xs">
                {TAB_CONFIG.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`relative inline-flex items-center gap-1.5 px-3 py-2 transition-colors ${
                      activeTab === key
                        ? "text-primary font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                    <span
                      className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        activeTab === key
                          ? "bg-primary/15 text-primary"
                          : "bg-muted/40 text-muted-foreground"
                      }`}
                    >
                      {getTabCount(key)}
                    </span>
                    {activeTab === key && (
                      <motion.div
                        layoutId="k8s-tab-indicator"
                        className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-t"
                      />
                    )}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="font-mono text-xs"
                >
                  {activeTab === "pods" && (
                    <div className="space-y-3">
                      {/* Search + Namespace Filter Bar */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        {/* Search input */}
                        <div className="relative flex-1">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                          <input
                            type="text"
                            placeholder="Filter pods by name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-8 pr-3 py-2 bg-zinc-950/60 border border-border rounded-md text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-colors"
                          />
                        </div>

                        {/* Namespace filter */}
                        <div className="relative shrink-0 min-w-[180px]">
                          <select
                            value={selectedNamespace}
                            onChange={(e) => setSelectedNamespace(e.target.value)}
                            className="w-full appearance-none pl-3 pr-8 py-2 bg-zinc-950/60 border border-border rounded-md text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-colors cursor-pointer"
                          >
                            <option value="all">All Namespaces</option>
                            {telemetry.namespaces.map((ns) => (
                              <option key={ns} value={ns}>
                                {ns}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                        </div>
                      </div>

                      {/* Results count */}
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[10px] text-muted-foreground">
                          Showing {filteredPods.length} of {telemetry.pods.length} pods
                          {selectedNamespace !== "all" && (
                            <span className="ml-1">
                              in <span className="text-primary">{selectedNamespace}</span>
                            </span>
                          )}
                        </span>
                        {searchQuery && (
                          <button
                            onClick={() => setSearchQuery("")}
                            className="text-[10px] text-muted-foreground hover:text-foreground transition-colors underline"
                          >
                            Clear filter
                          </button>
                        )}
                      </div>

                      {/* Pods Table */}
                      <div className="border border-border rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-zinc-950/60 border-b border-border text-muted-foreground">
                                <th className="py-2.5 px-3 text-[10px] uppercase tracking-wider font-semibold">
                                  Pod Name
                                </th>
                                <th className="py-2.5 px-3 text-[10px] uppercase tracking-wider font-semibold">
                                  Namespace
                                </th>
                                <th className="py-2.5 px-3 text-[10px] uppercase tracking-wider font-semibold">
                                  Status
                                </th>
                                <th className="py-2.5 px-3 text-[10px] uppercase tracking-wider font-semibold">
                                  Ready
                                </th>
                                <th className="py-2.5 px-3 text-[10px] uppercase tracking-wider font-semibold">
                                  Restarts
                                </th>
                                <th className="py-2.5 px-3 text-[10px] uppercase tracking-wider font-semibold">
                                  Age
                                </th>
                                <th className="py-2.5 px-3 text-[10px] uppercase tracking-wider font-semibold">
                                  Node
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredPods.length === 0 ? (
                                <tr>
                                  <td
                                    colSpan={7}
                                    className="py-12 text-center text-muted-foreground"
                                  >
                                    <div className="flex flex-col items-center gap-2">
                                      <Search className="w-5 h-5 text-zinc-600" />
                                      <span>No pods match the current filter</span>
                                    </div>
                                  </td>
                                </tr>
                              ) : (
                                filteredPods.map((pod, idx) => (
                                  <tr
                                    key={`${pod.namespace}-${pod.name}-${idx}`}
                                    className="border-b border-border/20 hover:bg-muted/10 transition-colors group"
                                  >
                                    {/* Pod Name */}
                                    <td className="py-2.5 px-3">
                                      <div className="flex items-center gap-2">
                                        <div
                                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${getStatusDot(
                                            pod.status
                                          )}`}
                                        />
                                        <span
                                          className="text-primary font-semibold truncate max-w-[240px]"
                                          title={pod.name}
                                        >
                                          {pod.name}
                                        </span>
                                      </div>
                                    </td>

                                    {/* Namespace */}
                                    <td className="py-2.5 px-3">
                                      <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-muted/30 text-zinc-300 text-[10px]">
                                        {pod.namespace}
                                      </span>
                                    </td>

                                    {/* Status */}
                                    <td className="py-2.5 px-3">
                                      <span
                                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${getStatusStyles(
                                          pod.status
                                        )}`}
                                      >
                                        {pod.status}
                                      </span>
                                    </td>

                                    {/* Ready */}
                                    <td className="py-2.5 px-3 text-muted-foreground">
                                      N/A
                                    </td>

                                    {/* Restarts */}
                                    <td className="py-2.5 px-3">
                                      <span
                                        className={`font-bold ${
                                          pod.restartCount > 0
                                            ? "text-amber-400"
                                            : "text-zinc-400"
                                        }`}
                                      >
                                        {pod.restartCount}
                                      </span>
                                      {pod.restartCount > 5 && (
                                        <AlertCircle className="inline-block w-3 h-3 ml-1 text-amber-400" />
                                      )}
                                    </td>

                                    {/* Age */}
                                    <td className="py-2.5 px-3 text-muted-foreground">
                                      N/A
                                    </td>

                                    {/* Node */}
                                    <td className="py-2.5 px-3 text-muted-foreground">
                                      N/A
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "deployments" && (
                    <div className="border border-border rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-zinc-950/60 border-b border-border text-muted-foreground">
                              <th className="py-2.5 px-3 text-[10px] uppercase tracking-wider font-semibold">
                                Deployment
                              </th>
                              <th className="py-2.5 px-3 text-[10px] uppercase tracking-wider font-semibold">
                                Namespace
                              </th>
                              <th className="py-2.5 px-3 text-[10px] uppercase tracking-wider font-semibold">
                                Desired
                              </th>
                              <th className="py-2.5 px-3 text-[10px] uppercase tracking-wider font-semibold">
                                Ready
                              </th>
                              <th className="py-2.5 px-3 text-[10px] uppercase tracking-wider font-semibold">
                                Status
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {telemetry.deployments.map((d, idx) => {
                              const isHealthy = d.readyReplicas >= d.replicas;
                              return (
                                <tr
                                  key={`${d.namespace}-${d.name}-${idx}`}
                                  className="border-b border-border/20 hover:bg-muted/10 transition-colors"
                                >
                                  <td className="py-2.5 px-3 text-primary font-semibold">
                                    {d.name}
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-muted/30 text-zinc-300 text-[10px]">
                                      {d.namespace}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 text-zinc-300 font-semibold">
                                    {d.replicas}
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <span
                                      className={`font-bold ${
                                        isHealthy ? "text-emerald-400" : "text-amber-400"
                                      }`}
                                    >
                                      {d.readyReplicas}
                                    </span>
                                    <span className="text-muted-foreground">/{d.replicas}</span>
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <span
                                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                        isHealthy
                                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                          : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                      }`}
                                    >
                                      {isHealthy ? "Available" : "Progressing"}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {activeTab === "services" && (
                    <div className="border border-border rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-zinc-950/60 border-b border-border text-muted-foreground">
                              <th className="py-2.5 px-3 text-[10px] uppercase tracking-wider font-semibold">
                                Service
                              </th>
                              <th className="py-2.5 px-3 text-[10px] uppercase tracking-wider font-semibold">
                                Namespace
                              </th>
                              <th className="py-2.5 px-3 text-[10px] uppercase tracking-wider font-semibold">
                                Type
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {telemetry.services.map((s, idx) => (
                              <tr
                                key={`${s.namespace}-${s.name}-${idx}`}
                                className="border-b border-border/20 hover:bg-muted/10 transition-colors"
                              >
                                <td className="py-2.5 px-3 text-primary font-semibold">
                                  {s.name}
                                </td>
                                <td className="py-2.5 px-3">
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-muted/30 text-zinc-300 text-[10px]">
                                    {s.namespace}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3">
                                  <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                      s.type === "ClusterIP"
                                        ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                                        : s.type === "NodePort"
                                        ? "bg-purple-500/10 text-purple-400 border-purple-500/30"
                                        : s.type === "LoadBalancer"
                                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                        : "bg-zinc-500/10 text-zinc-400 border-zinc-500/30"
                                    }`}
                                  >
                                    {s.type}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {activeTab === "namespaces" && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {telemetry.namespaces.map((ns, idx) => {
                        const podCount = telemetry.pods.filter(
                          (p) => p.namespace === ns
                        ).length;
                        return (
                          <div
                            key={idx}
                            className="group p-3 border border-border rounded-lg bg-zinc-950/40 hover:bg-muted/20 transition-colors cursor-default"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold text-zinc-200 text-xs truncate">
                                {ns}
                              </span>
                              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                              <Box className="w-3 h-3" />
                              <span>
                                {podCount} pod{podCount !== 1 ? "s" : ""}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  );
};

export default KubernetesPage;
