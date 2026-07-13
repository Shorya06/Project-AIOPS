/* eslint-disable react-refresh/only-export-components */
import React from "react";
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from "next-themes";

export type Theme = "dark" | "light" | "system";

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={true}
      storageKey="aiops-ui-theme"
    >
      {children}
    </NextThemesProvider>
  );
};

export const useTheme = () => {
  const { theme, setTheme, systemTheme } = useNextTheme();

  return {
    theme: (theme as Theme) || "dark",
    setTheme: (newTheme: Theme) => setTheme(newTheme),
    systemTheme: systemTheme as Theme | undefined,
  };
};
