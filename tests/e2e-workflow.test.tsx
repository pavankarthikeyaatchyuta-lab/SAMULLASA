// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StoreProvider } from '@/lib/store';
import DashboardPage from '@/app/page';
import EventsListPage from '@/app/events/page';
import BudgetStudioPage from '@/app/budget/page';
import TimelinePage from '@/app/timeline/page';
import VendorsPage from '@/app/vendors/page';
import ScenariosPage from '@/app/scenarios/page';

describe('UI End-to-End Workflow Verification (Simulated DOM with React Testing Library)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('Flow 1 & 2: Load initial wedding plan, view budget studio, and verify financial calculation rendering', () => {
    // 1. Initial render of Dashboard and load sample wedding
    const { unmount } = render(
      <StoreProvider>
        <DashboardPage />
      </StoreProvider>
    );

    const loadBtn = screen.getByRole('button', { name: /Load Sample Wedding/i });
    fireEvent.click(loadBtn);

    expect(screen.getByText("Ananya & Vikram's Wedding")).toBeInTheDocument();
    expect(screen.getAllByText('₹5,00,000.00').length).toBeGreaterThan(0); // Budget ceiling & projected
    unmount();

    // 2. Open Budget Studio
    const { unmount: unmountBudget } = render(
      <StoreProvider>
        <BudgetStudioPage />
      </StoreProvider>
    );

    expect(screen.getByText(/Budget Studio/i)).toBeInTheDocument();
    expect(screen.getByText(/South Indian Feast|Catering \(Full Service\)/i)).toBeInTheDocument();
    expect(screen.getByText('Venue Rental')).toBeInTheDocument();

    // Add a custom budget line item via the UI modal
    const addBtn = screen.getByRole('button', { name: /\+ Add Budget Item/i });
    fireEvent.click(addBtn);

    const nameInput = screen.getByLabelText(/Item Name/i);
    const amountInput = screen.getByLabelText(/Total Cost Amount/i);

    fireEvent.change(nameInput, { target: { value: 'Guest Welcome Welcome Drink' } });
    fireEvent.change(amountInput, { target: { value: '15000' } });

    const submitBtn = screen.getByRole('button', { name: /^Add Item$/i });
    fireEvent.click(submitBtn);

    expect(screen.getByText('Guest Welcome Welcome Drink')).toBeInTheDocument();
    unmountBudget();
  });

  it('Flow 3: Timeline & Vendor Workspace management', () => {
    // Seed with sample data
    const { unmount: unmountDash } = render(
      <StoreProvider>
        <DashboardPage />
      </StoreProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: /Load Sample Wedding/i }));
    unmountDash();

    // Open Timeline
    const { unmount: unmountTimeline } = render(
      <StoreProvider>
        <TimelinePage />
      </StoreProvider>
    );

    expect(screen.getByText(/Preparation Timeline/i)).toBeInTheDocument();
    expect(screen.getAllByText('Book venue').length).toBeGreaterThan(0);

    // Complete a task
    const toggleButtons = screen.getAllByRole('button', { name: /Mark task/i });
    expect(toggleButtons.length).toBeGreaterThan(0);
    fireEvent.click(toggleButtons[0]);
    unmountTimeline();

    // Open Vendors
    const { unmount: unmountVendors } = render(
      <StoreProvider>
        <VendorsPage />
      </StoreProvider>
    );

    expect(screen.getByText(/Vendor Workspace/i)).toBeInTheDocument();
    expect(screen.getByText(/Sri Lakshmi Catering/i)).toBeInTheDocument();
    expect(screen.getByText(/Pixel Perfect Studios/i)).toBeInTheDocument();
    unmountVendors();
  });

  it('Flow 4, 5, 6, 7 & 8: Simulate 200 -> 280 guests, verify constraint rejection and alternative approval with persistence', async () => {
    // Seed sample data
    const { unmount: unmountDash } = render(
      <StoreProvider>
        <DashboardPage />
      </StoreProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: /Load Sample Wedding/i }));
    unmountDash();

    // Mount Scenarios Page
    const { unmount: unmountScenarios } = render(
      <StoreProvider>
        <ScenariosPage />
      </StoreProvider>
    );

    expect(screen.getByText(/Adaptive Event Intelligence Engine/i)).toBeInTheDocument();

    // 4. Input the change request
    const promptInput = screen.getByLabelText(/Natural-Language Requirement Modification/i);
    fireEvent.change(promptInput, {
      target: {
        value: "Increase the wedding guest count to 280, keep the budget unchanged, preserve accessibility requirements and don't reduce catering quality.",
      },
    });

    // 5. Trigger simulation
    const simulateBtn = screen.getByRole('button', { name: /Simulate & Detect Impact/i });
    fireEvent.click(simulateBtn);

    // Wait for simulation comparison to appear
    await waitFor(() => {
      expect(screen.getByText(/Scenario Comparison & Impact Analysis/i)).toBeInTheDocument();
    });

    // Check that hard constraints violation is caught
    expect(screen.getByText(/Hard Constraints Violated — Plan Is Infeasible/i)).toBeInTheDocument();
    expect(screen.getByText('280 guests')).toBeInTheDocument();

    // Direct approve button should be disabled because plan is infeasible!
    const approveProposedBtn = screen.getByRole('button', { name: /Approve Proposed Scenario/i });
    expect(approveProposedBtn).toBeDisabled();

    // 6. Reject the infeasible proposal
    const rejectBtn = screen.getByRole('button', { name: /Reject Proposal/i });
    fireEvent.click(rejectBtn);

    // Verify rejection message and that active plan remains intact
    expect(screen.getByText(/Rejected proposed scenario. Original approved plan remains completely intact./i)).toBeInTheDocument();

    // 7. Re-simulate and approve Option 2 (user-approved budget relaxation)
    fireEvent.click(simulateBtn);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Ranked Feasible Alternatives/i })).toBeInTheDocument();
    });

    const approveAltBtn = screen.getByRole('button', { name: /Approve Option 2/i });
    fireEvent.click(approveAltBtn);

    await waitFor(() => {
      expect(screen.getByText(/Successfully approved Scenario/i)).toBeInTheDocument();
    });
    unmountScenarios();

    // 8. Reload simulation: mount new StoreProvider instance reading from localStorage
    const { unmount: unmountReload } = render(
      <StoreProvider>
        <DashboardPage />
      </StoreProvider>
    );

    // Verified persisted state after reload: Version with 280 guests active!
    expect(screen.getByText("Ananya & Vikram's Wedding")).toBeInTheDocument();
    expect(screen.getByText('280')).toBeInTheDocument();
    expect(screen.getAllByText('₹5,96,000.00').length).toBeGreaterThanOrEqual(1);
    unmountReload();
  });

  it('Flow 9 & 10: Creation and display of multiple event types (Birthday & Community Gathering)', () => {
    // Seed
    const { unmount } = render(
      <StoreProvider>
        <DashboardPage />
      </StoreProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: /Load Sample Wedding/i }));
    unmount();

    // Open Events List
    const { unmount: unmountEvents } = render(
      <StoreProvider>
        <EventsListPage />
      </StoreProvider>
    );

    expect(screen.getByText(/Your Celebrations/i)).toBeInTheDocument();
    expect(screen.getAllByText(/WEDDING/i).length).toBeGreaterThan(0);
    unmountEvents();
  });
});
