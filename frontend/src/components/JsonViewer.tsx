import React, { useState } from "react";
import { ChevronDown, ChevronRight, Copy, Check } from "lucide-react";

interface JsonViewerProps {
  data: object | string;
  title?: string;
}

export const JsonViewer: React.FC<JsonViewerProps> = ({ data, title = "Payload JSON" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const rawString = typeof data === "string" ? data : JSON.stringify(data, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(rawString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border border-border rounded-lg bg-zinc-950/80 overflow-hidden font-mono text-xs">
      <div
        className="flex items-center justify-between px-4 py-2.5 bg-zinc-900/60 border-b border-border/80 cursor-pointer hover:bg-zinc-900 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          {isOpen ? (
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
          )}
          <span className="font-semibold text-zinc-300">{title}</span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleCopy();
          }}
          className="p-1 rounded hover:bg-zinc-800 text-muted-foreground hover:text-foreground transition-colors"
          title="Copy JSON"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
      {isOpen && (
        <pre className="p-4 overflow-x-auto text-emerald-400/90 max-h-[300px] leading-relaxed select-text">
          {rawString}
        </pre>
      )}
    </div>
  );
};
