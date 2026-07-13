import React from "react";

interface SectionCardProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const SectionCard: React.FC<SectionCardProps> = ({
  title,
  description,
  children,
  actions,
  className = "",
}) => {
  return (
    <div className={`bg-card text-card-foreground border border-border rounded-lg shadow-sm overflow-hidden p-5 ${className}`}>
      {(title || description || actions) && (
        <div className="flex items-center justify-between gap-4 pb-4 mb-4 border-b border-border/80">
          <div>
            {title && <h3 className="text-sm font-semibold font-mono text-foreground">{title}</h3>}
            {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className="text-sm text-foreground/90">{children}</div>
    </div>
  );
};
