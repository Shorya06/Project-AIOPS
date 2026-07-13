import React from "react";
import { AlertOctagon, FolderOpen, ShieldAlert, FileQuestion, RefreshCw } from "lucide-react";
import { LoadingSpinner } from "./LoadingSpinner";

// 1. LoadingState
interface LoadingStateProps {
  message?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = "Resolving failure context metrics...",
  className = "",
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center min-h-[300px] ${className}`}>
      <LoadingSpinner size="lg" className="mb-4" />
      <p className="text-sm text-muted-foreground animate-pulse">{message}</p>
    </div>
  );
};

// 2. ErrorState
interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "API Query Error",
  message,
  onRetry,
  className = "",
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center border border-rose-500/20 bg-rose-500/5 rounded-lg min-h-[300px] ${className}`}>
      <AlertOctagon className="w-12 h-12 text-rose-500 mb-4" />
      <h3 className="text-lg font-semibold text-rose-400 mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md mb-6">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center px-4 py-2 text-xs font-semibold rounded-md bg-rose-500 text-white hover:bg-rose-600 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-2" />
          Retry Connection
        </button>
      )}
    </div>
  );
};

// 3. EmptyState
interface EmptyStateProps {
  title?: string;
  message?: string;
  actionButton?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = "No Records Found",
  message = "There are no entries mapping to the current filter query.",
  actionButton,
  className = "",
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center border border-dashed border-border rounded-lg min-h-[300px] ${className}`}>
      <FolderOpen className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md mb-6">{message}</p>
      {actionButton}
    </div>
  );
};

// 4. UnauthorizedState
interface UnauthorizedStateProps {
  title?: string;
  message?: string;
  className?: string;
}

export const UnauthorizedState: React.FC<UnauthorizedStateProps> = ({
  title = "Access Unauthorized",
  message = "Your active credentials do not have permissions to read this route. Authenticate with SRE privileges.",
  className = "",
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center border border-amber-500/20 bg-amber-500/5 rounded-lg min-h-[300px] ${className}`}>
      <ShieldAlert className="w-12 h-12 text-amber-500 mb-4" />
      <h3 className="text-lg font-semibold text-amber-400 mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md">{message}</p>
    </div>
  );
};

// 5. NotFoundState (404 View)
interface NotFoundStateProps {
  title?: string;
  message?: string;
  actionLink?: React.ReactNode;
  className?: string;
}

export const NotFoundState: React.FC<NotFoundStateProps> = ({
  title = "Resource Not Found",
  message = "The dashboard coordinate or node resource you are referencing is out of bounds.",
  actionLink,
  className = "",
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center min-h-[400px] ${className}`}>
      <FileQuestion className="w-16 h-16 text-primary mb-4 animate-bounce" />
      <h2 className="text-2xl font-bold text-foreground mb-2">{title}</h2>
      <p className="text-sm text-muted-foreground max-w-md mb-8">{message}</p>
      {actionLink}
    </div>
  );
};
