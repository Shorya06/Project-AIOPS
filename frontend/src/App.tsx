import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import { Toaster } from 'sonner';
import { AppLayout } from "@/layouts/AppLayout";
import { LoadingState, NotFoundState } from "@/components/FeedbackStates";

// Lazy-loaded views
const DashboardPage = lazy(() => import("@/pages/Dashboard"));
const KubernetesPage = lazy(() => import("@/pages/Kubernetes"));
const AlertsPage = lazy(() => import("@/pages/Alerts"));
const AIPage = lazy(() => import("@/pages/AI"));
const HealingPage = lazy(() => import("@/pages/Healing"));
const MetricsPage = lazy(() => import("@/pages/Metrics"));
const AuditPage = lazy(() => import("@/pages/Audit"));
const SettingsPage = lazy(() => import("@/pages/Settings"));

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Main Layout containing Side Navigation and Topbar */}
        <Route path="/" element={<AppLayout />}>
          {/* Index Redirect to Dashboard */}
          <Route index element={<Navigate to="/dashboard" replace />} />

          {/* Lazy loaded routes wrapped in Suspense boundaries */}
          <Route
            path="dashboard"
            element={
              <Suspense fallback={<LoadingState message="Initializing Control Center metrics..." />}>
                <DashboardPage />
              </Suspense>
            }
          />
          <Route
            path="kubernetes"
            element={
              <Suspense fallback={<LoadingState message="Scraping Kubernetes cluster telemetry..." />}>
                <KubernetesPage />
              </Suspense>
            }
          />
          <Route
            path="alerts"
            element={
              <Suspense fallback={<LoadingState message="Fetching active incident alerts..." />}>
                <AlertsPage />
              </Suspense>
            }
          />
          <Route
            path="ai"
            element={
              <Suspense fallback={<LoadingState message="Pulling Gemini diagnosis ledger..." />}>
                <AIPage />
              </Suspense>
            }
          />
          <Route
            path="healing"
            element={
              <Suspense fallback={<LoadingState message="Gathering self-healing trace executions..." />}>
                <HealingPage />
              </Suspense>
            }
          />
          <Route
            path="metrics"
            element={
              <Suspense fallback={<LoadingState message="Syncing Prometheus targets scraper..." />}>
                <MetricsPage />
              </Suspense>
            }
          />
          <Route
            path="audit"
            element={
              <Suspense fallback={<LoadingState message="Formatting transaction correlation logs..." />}>
                <AuditPage />
              </Suspense>
            }
          />
          <Route
            path="settings"
            element={
              <Suspense fallback={<LoadingState message="Loading remediation policies config..." />}>
                <SettingsPage />
              </Suspense>
            }
          />

          {/* Fallback Custom 404 Route */}
          <Route
            path="*"
            element={
              <NotFoundState
                actionLink={
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center px-4 py-2 text-xs font-semibold rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                  >
                    Return to Control Center
                  </Link>
                }
              />
            }
          />
        </Route>
      </Routes>
      <Toaster position="bottom-right" theme="dark" richColors />
    </BrowserRouter>
  );
}
