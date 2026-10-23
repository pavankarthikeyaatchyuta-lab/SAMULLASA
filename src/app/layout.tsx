import type { Metadata } from 'next';
import './globals.css';
import { StoreProvider } from '@/lib/store';
import AppShell from '@/components/app-shell';

export const metadata: Metadata = {
  title: 'SAMULLĀSA — Adaptive Celebration & Event Planner',
  description: 'AI-powered celebration and event planning workspace for PromptWars Virtual Challenge 5. Plan weddings, birthdays, and community events with budgets, timelines, vendors, and adaptive intelligence.',
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
