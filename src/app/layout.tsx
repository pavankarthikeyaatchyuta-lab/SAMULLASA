import type { Metadata } from 'next';
import './globals.css';
import { StoreProvider } from '@/lib/store';
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
    <html lang="en">
      <body className="min-h-screen bg-[var(--background)] text-[var(--foreground)] antialiased">
        <StoreProvider>
          <AppShell>{children}</AppShell>
        </StoreProvider>
      </body>
    </html>
  );
}
