'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  {
    href: '/',
    label: 'Dashboard',
    badge: 'Overview',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: '/events',
    label: 'Celebrations',
    badge: 'Events',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    href: '/budget',
    label: 'Budget Studio',
    badge: 'Paise Math',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    href: '/timeline',
    label: 'Timeline & Tasks',
    badge: 'Milestones',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    href: '/vendors',
    label: 'Vendor Workspace',
    badge: 'Contracts',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    href: '/scenarios',
    label: 'Adaptive Engine',
    badge: '⚡ AI Core',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      {/* Accessibility Skip link */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-[var(--surface)]/95 backdrop-blur-md border-b border-[var(--border)] px-4 lg:px-8 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto w-full">
          {/* Mobile menu trigger */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-[var(--radius-md)] hover:bg-[var(--surface-secondary)] text-[var(--foreground)] transition-colors"
              aria-label="Toggle navigation menu"
              aria-expanded={sidebarOpen}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Mobile Logo */}
            <Link href="/" className="lg:hidden flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--primary-hover)] flex items-center justify-center text-white font-bold text-sm shadow-sm">
                स
              </div>
              <span className="text-base font-bold text-[var(--primary)] tracking-tight">SAMULLĀSA</span>
            </Link>

            {/* Desktop Brand Tagline */}
            <div className="hidden lg:flex items-center gap-3 pl-64">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--primary-light)] text-[var(--primary)] border border-[var(--primary-muted)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
                Adaptive Celebration Intelligence
              </span>
              <span className="text-xs text-[var(--muted)]">
                Zero Floating-Point Financial Engine • Indian Celebrations & Community
              </span>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3">
            <Link href="/events/new">
              <button className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-secondary)] text-[var(--foreground)] transition-colors shadow-xs">
                <span>+</span> New Celebration
              </button>
            </Link>

            <Link href="/scenarios">
              <button className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold bg-gradient-to-r from-[var(--primary)] to-[var(--primary-hover)] text-white hover:opacity-95 transition-all shadow-xs">
                <span>⚡</span> Adaptive Simulator
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Persistent Left Sidebar */}
      <nav
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[var(--surface)] border-r border-[var(--border)] transform transition-transform duration-200 lg:translate-x-0 flex flex-col justify-between shadow-xs ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Main navigation"
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Brand Header */}
          <div className="p-5 border-b border-[var(--border)] bg-gradient-to-b from-[var(--surface-secondary)]/50 to-transparent">
            <Link href="/" className="flex items-center gap-3 group" onClick={() => setSidebarOpen(false)}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary)] via-[var(--primary-hover)] to-[#2A082C] flex items-center justify-center shadow-md shadow-[var(--primary)]/20 ring-2 ring-[var(--accent)]/30">
                <span className="text-white font-bold text-lg tracking-tight">स</span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-base font-extrabold text-[var(--primary)] tracking-tight">SAMULLĀSA</h1>
                </div>
                <p className="text-[11px] font-medium text-[var(--muted)]">Celebration Studio</p>
              </div>
            </Link>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 py-5 px-3 space-y-1.5 overflow-y-auto">
            <p className="px-3 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">
              Planning Workspace
            </p>
            {NAV_ITEMS.map((item) => {
              const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-[var(--radius-md)] text-sm font-semibold transition-all group ${
                    isActive
                      ? 'bg-[var(--primary-light)] text-[var(--primary)] shadow-xs font-bold border-l-4 border-l-[var(--primary)]'
                      : 'text-[var(--muted)] hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <div className="flex items-center gap-3">
                    <span className={`transition-colors ${isActive ? 'text-[var(--primary)]' : 'text-[var(--muted)] group-hover:text-[var(--foreground)]'}`}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-[var(--primary)] text-white'
                        : 'bg-[var(--surface-secondary)] text-[var(--muted)]'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* System Status Footer Card */}
          <div className="p-4 border-t border-[var(--border)] bg-[var(--surface-secondary)]/30">
            <div className="p-3 rounded-[var(--radius-md)] bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[var(--foreground)] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[var(--success)]" />
                  Engine Active
                </span>
                <span className="text-[10px] font-mono text-[var(--muted)]">v2.4</span>
              </div>
              <p className="text-[11px] text-[var(--muted)] leading-tight">
                Paise integer arithmetic • Directed acyclic graphs • Local persistence
              </p>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main
        id="main-content"
        className="lg:ml-64 flex-1 pb-16"
        tabIndex={-1}
      >
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
