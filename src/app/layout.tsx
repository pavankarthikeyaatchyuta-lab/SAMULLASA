import type { Metadata } from 'next';
import './globals.css';
import { StoreProvider } from '@/lib/store';
import { ThemeProvider } from '@/components/theme-toggle';
import AppShell from '@/components/app-shell';

export const metadata: Metadata = {
  title: 'SAMULLĀSA — Adaptive Celebration & Event Intelligence Studio',
  description: 'AI-powered celebration and event planning workspace. Plan weddings, birthdays, and community gatherings with deterministic budgets, date-aware timelines, vendor workflows, and adaptive recovery intelligence.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" data-theme="dark" style={{ colorScheme: 'dark' }} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('samullasa-theme')||'dark';document.documentElement.className=t;document.documentElement.setAttribute('data-theme',t);document.documentElement.style.colorScheme=t;}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-screen bg-[var(--background)] text-[var(--foreground)] antialiased transition-colors duration-200">
        <StoreProvider>
          <ThemeProvider>
            <AppShell>{children}</AppShell>
          </ThemeProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
