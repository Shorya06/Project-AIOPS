/**
 * UI Specific components interfaces & presentation states.
 * Represents client state.
 */

import React from "react";

export interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

export type ThemeMode = "dark" | "light" | "system";

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type: "success" | "error" | "info" | "warning";
}
