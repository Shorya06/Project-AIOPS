import React, { useState } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import { useTheme } from "@/hooks/useTheme";
import {
  LayoutDashboard,
  Cpu,
  AlertTriangle,
  Brain,
  ShieldCheck,
  Activity,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Bell,
  Search,
} from "lucide-react";

export const AppLayout: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { theme, setTheme } = useTheme();
  const location = useLocation();

  // Navigation configurations
  const navItems = [
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { label: "Kubernetes", path: "/kubernetes", icon: Cpu },
    { label: "Alerts", path: "/alerts", icon: AlertTriangle },
    { label: "AI Diagnosis", path: "/ai", icon: Brain },
    { label: "Healing", path: "/healing", icon: ShieldCheck },
    { label: "Metrics", path: "/metrics", icon: Activity },
    { label: "Audit Logs", path: "/audit", icon: History },
    { label: "Settings", path: "/settings", icon: Settings },
  ];

  const pathnames = location.pathname.split("/").filter((x) => x);

  return (
    <div className="min-h-screen flex bg-background text-foreground transition-colors duration-200">
      
      {/* 1. Fixed Global Loading Overlay Region (Placeholder) */}
      <div id="global-loading-overlay" className="hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-[9999] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-semibold tracking-wider text-primary font-mono">SYNCING METRICS...</span>
        </div>
      </div>

      {/* 2. Fixed Command Palette Region (Placeholder) */}
      <div id="command-palette-region" className="hidden">
        {/* Placeholder for future Command Palette (Ctrl+K listener) */}
      </div>

      {/* 3. Fixed Global Notification Toaster Region (Placeholder) */}
      <div id="global-toaster-region" className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {/* Placeholder for global notification alerts */}
      </div>

      {/* Sidebar Drawer */}
      <aside
        className={`bg-card border-r border-border flex flex-col transition-all duration-300 z-30 ${
          isCollapsed ? "w-16" : "w-64"
        }`}
        aria-label="Sidebar Navigation"
      >
        {/* Sidebar Brand header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-border">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center shrink-0">
              <span className="text-primary-foreground font-bold text-sm font-mono">Ω</span>
            </div>
            {!isCollapsed && (
              <span className="font-bold text-sm tracking-wider font-mono text-foreground truncate">
                AIOPS SYSTEM
              </span>
            )}
          </div>
        </div>

        {/* Sidebar Nav Links */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto" aria-label="Main Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-semibold tracking-wide transition-all group outline-none focus:ring-1 focus:ring-ring ${
                    isActive
                      ? "bg-primary/10 text-primary border-l-2 border-primary pl-2.5"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`
                }
                title={isCollapsed ? item.label : undefined}
                aria-label={item.label}
              >
                <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-105" />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Collapse Action Toggle */}
        <div className="p-2 border-t border-border flex items-center justify-center">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full py-2 flex items-center justify-center rounded-md hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
            title={isCollapsed ? "Expand Navigation" : "Collapse Navigation"}
            aria-label="Toggle Sidebar Navigation"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </aside>

      {/* Main Page Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Navbar */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 z-20 shadow-sm">
          <div className="flex items-center gap-4">
            
            {/* 4. Fixed Breadcrumb Navigation Region */}
            <nav className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono" aria-label="Breadcrumb">
              <span className="hover:text-foreground cursor-pointer">AIOPS</span>
              {pathnames.map((name, index) => {
                const routeTo = `/${pathnames.slice(0, index + 1).join("/")}`;
                const isLast = index === pathnames.length - 1;
                return (
                  <React.Fragment key={routeTo}>
                    <span className="text-border">/</span>
                    <NavLink
                      to={routeTo}
                      className={isLast ? "text-foreground font-semibold" : "hover:text-foreground"}
                    >
                      {name.toUpperCase()}
                    </NavLink>
                  </React.Fragment>
                );
              })}
            </nav>
          </div>

          {/* Top Bar Actions & Status Counters */}
          <div className="flex items-center gap-4">
            
            {/* Command Palette Mock Trigger */}
            <div className="hidden lg:flex items-center gap-2 border border-border bg-background px-3 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
              <Search className="w-3.5 h-3.5" />
              <span>Search node configs...</span>
              <kbd className="bg-muted px-1.5 py-0.5 rounded text-[10px] border border-border">Ctrl+K</kbd>
            </div>

            {/* Cluster Status Health Pill */}
            <div className="flex items-center gap-2 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider font-mono">
                Cluster: Active
              </span>
            </div>

            {/* Active AI Model Badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 border border-primary/20 rounded-full">
              <Brain className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] font-bold text-primary font-mono">
                gemini-3.5-flash
              </span>
            </div>

            {/* Light / Dark Mode Theme Toggle */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-md hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
              title="Toggle Theme"
              aria-label="Toggle Theme Mode"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Notifications Panel */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-md hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors relative"
                title="Notifications"
                aria-label="View notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
              </button>
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-64 bg-card border border-border rounded-md shadow-lg py-2 z-50 text-xs">
                  <div className="px-3 py-1 font-bold border-b border-border pb-2 text-foreground uppercase tracking-wider font-mono">
                    Recent Alerts
                  </div>
                  <div className="px-3 py-2 text-muted-foreground hover:bg-muted/30 cursor-pointer">
                    [Alertmanager] PodCrashLooping alert triggered on transaction-service.
                  </div>
                  <div className="px-3 py-2 text-muted-foreground border-t border-border/40 text-center font-mono">
                    No other pending alerts
                  </div>
                </div>
              )}
            </div>

            {/* User Avatar Placeholder */}
            <div className="flex items-center gap-2 pl-2 border-l border-border">
              <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center font-bold text-xs text-primary font-mono shrink-0">
                SRE
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Route View outlet */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8" aria-label="Page Content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
