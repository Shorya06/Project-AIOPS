import React from "react";
import { PageHeader } from "@/components/PageHeader";
import { SectionCard } from "@/components/SectionCard";
import { StatusCard } from "@/components/StatusCard";

const SettingsPage: React.FC = () => {
  const configs = [
    { label: "Current AI Model", value: "gemini-3.5-flash", desc: "Selected LLM provider model" },
    { label: "Confidence Threshold", value: "0.7", desc: "Safety gate; blocks low-confidence runs" },
    { label: "Feedback Loop Delay", value: "60 seconds", desc: "Liveness verification wait timer" },
    { label: "Maximum Pod Replicas", value: "5", desc: "Scale whitelists ceiling limit" },
    { label: "Maximum Memory Allocation", value: "2048Mi", desc: "Memory patch whitelists limit" },
    { label: "Platform Target Namespace", value: "aiops", desc: "Kubernetes namespace target" },
    { label: "Gemini API Link status", value: "Operational", desc: "Secret API token verified" },
    { label: "Control Center Version", value: "v1.0.0", desc: "Frontend React SPA packaging" },
  ];

  return (
    <div>
      <PageHeader
        title="Settings & Policies"
        description="View self-healing engine safety parameters, thresholds, and AI model configurations. Settings are read-only."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatusCard title="Remediation Mode" status="Dry-Run (Audit)" type="info" details="No automatic cluster changes active" />
        <StatusCard title="API Gateway Status" status="Healthy" type="healthy" details="Port 8080 proxy online" />
        <StatusCard title="Database Synced" status="PostgreSQL" type="healthy" details="Remediations audit trails online" />
        <StatusCard title="Platform Policies" status="Strict Guardrails" type="info" details="Limits and replica bounds whitelisted" />
      </div>

      <SectionCard title="Active SRE Policy Guardrails" description="Read-only platform configuration profiles. Changes are disabled.">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mt-4">
          {configs.map((cfg, idx) => (
            <div key={idx} className="bg-zinc-950/40 border border-border p-4 rounded-lg flex flex-col justify-between font-mono text-xs shadow-sm">
              <span className="text-muted-foreground uppercase text-[10px] font-bold tracking-wider">{cfg.label}</span>
              <span className="text-sm font-semibold text-primary mt-2">{cfg.value}</span>
              <span className="text-[10px] text-muted-foreground mt-1.5 leading-relaxed">{cfg.desc}</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
};

export default SettingsPage;
