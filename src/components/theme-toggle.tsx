'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  toggleTheme: () => {},
  setTheme: () => {},
});

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  try {
    const stored = localStorage.getItem('samullasa-theme') as Theme | null;
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    // Ignore storage errors
  }
  return 'dark';
}

function applyTheme(t: Theme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.remove('dark', 'light');
  root.classList.add(t);
  root.setAttribute('data-theme', t);
  root.style.colorScheme = t;
  try {
    localStorage.setItem('samullasa-theme', t);
  } catch {
    // Ignore if storage is unavailable
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = (t: Theme) => {
    setThemeState(t);
  };

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

interface ThemeToggleProps {
  className?: string;
  showLabels?: boolean;
}

export function ThemeToggle({ className = '', showLabels = true }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`inline-flex items-center gap-1 p-1 rounded-full bg-[var(--surface-secondary)] border border-[var(--border)] text-xs font-semibold shadow-xs hover:border-[var(--accent)] transition-all cursor-pointer ${className}`}
      aria-label={`Toggle theme: current is ${theme}. Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Current: ${theme === 'dark' ? 'Dark 🌙' : 'Light ☀️'} (Click to switch to ${theme === 'dark' ? 'Light ☀️' : 'Dark 🌙'})`}
    >
      {/* Dark Mode Symbol & Label */}
      <span
        className={`px-2 py-0.5 rounded-full flex items-center gap-1 text-xs transition-all ${
          theme === 'dark'
            ? 'bg-[var(--primary)] text-white shadow-xs font-bold'
            : 'text-[var(--muted)] hover:text-[var(--foreground)]'
        }`}
      >
        <span role="img" aria-label="Dark mode" className="text-sm">🌙</span>
        {showLabels && <span className="hidden sm:inline text-[11px] font-bold">Dark</span>}
      </span>

      {/* Light Mode Symbol & Label */}
      <span
        className={`px-2 py-0.5 rounded-full flex items-center gap-1 text-xs transition-all ${
          theme === 'light'
            ? 'bg-[var(--accent)] text-[var(--accent-foreground)] shadow-xs font-bold'
            : 'text-[var(--muted)] hover:text-[var(--foreground)]'
        }`}
      >
        <span role="img" aria-label="Light mode" className="text-sm">☀️</span>
        {showLabels && <span className="hidden sm:inline text-[11px] font-bold">Light</span>}
      </span>
    </button>
  );
}
