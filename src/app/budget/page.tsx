'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import {
  formatPaise,
  calculateBudgetSummary,
  getCategoryLabel,
} from '@/lib/budget-engine';
import { Card, Button, Input, Select, Badge, ProgressBar, Modal, EmptyState } from '@/components/ui';
import type { BudgetCategory, BudgetItem, CostStatus, CostType } from '@/types/events';

export default function BudgetStudioPage() {
  const { state, dispatch, getCurrentScenario } = useStore();
  const [selectedEventId, setSelectedEventId] = useState<string>(
    state.events[0]?.id || '',
  );

  const activeEvent = state.events.find((e) => e.id === selectedEventId) || state.events[0];
  const activeScenario = activeEvent ? getCurrentScenario(activeEvent.id) : undefined;

  // Modal State for adding/editing line items
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null);

  // Form Fields
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState<BudgetCategory>('catering');
  const [costType, setCostType] = useState<CostType>('fixed');
  const [amountInput, setAmountInput] = useState('');
  const [unitRateInput, setUnitRateInput] = useState('');
  const [status, setStatus] = useState<CostStatus>('estimated');
  const [depositInput, setDepositInput] = useState('');
  const [sourceNote, setSourceNote] = useState('');

  // Category filter
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const summary = activeScenario && activeEvent
    ? calculateBudgetSummary(
        activeScenario.budgetItems,
        activeScenario.budgetCeilingPaise,
        activeScenario.guestCount,
      )
    : null;

  const handleOpenAdd = () => {
    setEditingItem(null);
    setItemName('');
    setCategory('catering');
    setCostType('fixed');
    setAmountInput('');
    setUnitRateInput('');
    setStatus('estimated');
    setDepositInput('');
    setSourceNote('User configured estimate');
    setModalOpen(true);
  };

  const handleOpenEdit = (item: BudgetItem) => {
    setEditingItem(item);
    setItemName(item.name);
    setCategory(item.category);
    setCostType(item.costType);
    setAmountInput((item.amountPaise / 100).toString());
    setUnitRateInput(item.unitRatePaise ? (item.unitRatePaise / 100).toString() : '');
    setStatus(item.status);
    setDepositInput(item.depositPaise ? (item.depositPaise / 100).toString() : '');
    setSourceNote(item.sourceNote || '');
    setModalOpen(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeScenario) return;

    const guestCount = activeScenario.guestCount || 100;
    let finalAmountPaise = 0;
    let unitRatePaise: number | undefined = undefined;

    if (costType === 'per_person') {
      const rate = Math.round(Number(unitRateInput || 0) * 100);
      unitRatePaise = rate;
      finalAmountPaise = rate * guestCount;
    } else {
      finalAmountPaise = Math.round(Number(amountInput || 0) * 100);
    }

    const depositPaise = Math.round(Number(depositInput || 0) * 100);

    if (editingItem) {
      // Update
      dispatch({
        type: 'UPDATE_BUDGET_ITEM',
        payload: {
          scenarioId: activeScenario.id,
          itemId: editingItem.id,
          updates: {
            name: itemName,
            category,
            costType,
            amountPaise: finalAmountPaise,
            unitRatePaise,
            unitCount: costType === 'per_person' ? guestCount : undefined,
            status,
            depositPaise,
            sourceNote: sourceNote || 'User modified line item',
            updatedAt: new Date().toISOString(),
          },
        },
      });
    } else {
      // Create
      const newItem: BudgetItem = {
        id: crypto.randomUUID(),
        name: itemName,
        category,
        costType,
        amountPaise: finalAmountPaise,
        unitRatePaise,
        unitCount: costType === 'per_person' ? guestCount : undefined,
        status,
        depositPaise,
        isGenerated: false,
        sourceNote: sourceNote || 'Direct entry',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      dispatch({
        type: 'ADD_BUDGET_ITEM',
        payload: {
          scenarioId: activeScenario.id,
          item: newItem,
        },
      });
    }

    setModalOpen(false);
  };

  const handleDeleteItem = (itemId: string) => {
    if (!activeScenario) return;
    if (confirm('Delete this budget item?')) {
      dispatch({
        type: 'REMOVE_BUDGET_ITEM',
        payload: {
          scenarioId: activeScenario.id,
          itemId,
        },
      });
    }
  };

  if (!activeEvent || !activeScenario || !summary) {
    return (
      <EmptyState
        title="No Event Selected"
        description="Please create or load an event to manage the budget studio."
        action={
          <Button onClick={() => dispatch({ type: 'LOAD_SAMPLE_DATA' })} variant="primary">
            Load Sample Event
          </Button>
        }
      />
    );
  }

  const filteredItems = selectedCategory === 'all'
    ? activeScenario.budgetItems
    : activeScenario.budgetItems.filter((i) => i.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[var(--border)]">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Budget Studio</h1>
          <p className="text-sm text-[var(--muted)]">
            Deterministic financial arithmetic with zero floating-point error
          </p>
        </div>

        <div className="flex items-center gap-3">
          {state.events.length > 1 && (
            <select
              value={activeEvent.id}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="px-3 py-1.5 text-sm border border-[var(--border)] rounded-[var(--radius-md)] bg-[var(--surface)] text-[var(--foreground)]"
            >
              {state.events.map((ev) => (
                <option key={ev.id} value={ev.id}>{ev.name}</option>
              ))}
            </select>
          )}

          <Button onClick={handleOpenAdd} variant="primary" size="sm">
            + Add Budget Item
          </Button>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="md">
          <p className="text-xs font-semibold text-[var(--muted)] uppercase">Budget Ceiling</p>
          <p className="text-2xl font-bold mt-1 text-[var(--primary)]">
            {formatPaise(summary.ceilingPaise)}
          </p>
          <p className="text-xs text-[var(--muted)] mt-2">
            Strict ceiling limit for {activeScenario.guestCount} guests
          </p>
        </Card>

        <Card padding="md">
          <p className="text-xs font-semibold text-[var(--muted)] uppercase">Projected Total</p>
          <p className={`text-2xl font-bold mt-1 ${summary.isOverBudget ? 'text-[var(--danger)]' : 'text-[var(--foreground)]'}`}>
            {formatPaise(summary.projectedTotalPaise)}
          </p>
          <div className="mt-2">
            <ProgressBar
              value={summary.utilizationPercent}
              label="Utilization"
              variant={summary.isOverBudget ? 'danger' : 'default'}
            />
          </div>
        </Card>

        <Card padding="md">
          <p className="text-xs font-semibold text-[var(--muted)] uppercase">Committed / Paid</p>
          <p className="text-2xl font-bold mt-1 text-[var(--foreground)]">
            {formatPaise(summary.actualSpentPaise)}
          </p>
          <p className="text-xs text-[var(--muted)] mt-2">
            Outstanding buffer: {formatPaise(summary.remainingPaise)}
          </p>
        </Card>

        <Card padding="md">
          <p className="text-xs font-semibold text-[var(--muted)] uppercase">Contingency Reserve</p>
          <p className="text-2xl font-bold mt-1 text-[var(--accent)]">
            {formatPaise(summary.contingencyPaise)}
          </p>
          <p className="text-xs text-[var(--muted)] mt-2">
            Per-guest cost: {formatPaise(summary.perPersonPaise)}
          </p>
        </Card>
      </div>

      {/* Category Breakdown Bars */}
      <Card padding="md">
        <h3 className="text-sm font-bold text-[var(--foreground)] mb-3">Category Breakdown</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {(Object.entries(summary.categoryBreakdown) as [BudgetCategory, number][])
            .filter(([, amount]) => amount > 0)
            .map(([cat, amount]) => {
              const pct = summary.projectedTotalPaise > 0
                ? Math.round((amount / summary.projectedTotalPaise) * 100)
                : 0;
              return (
                <div key={cat} className="p-2.5 bg-[var(--surface-secondary)] rounded-[var(--radius-md)] text-xs">
                  <p className="text-[var(--muted)] font-medium truncate">{getCategoryLabel(cat)}</p>
                  <p className="font-bold text-sm text-[var(--foreground)] mt-0.5">{formatPaise(amount)}</p>
                  <p className="text-[10px] text-[var(--muted)] mt-1">{pct}% of total</p>
                </div>
              );
            })}
        </div>
      </Card>

      {/* Category Filter & Table */}
      <Card padding="none" className="overflow-hidden">
        <div className="p-4 border-b border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--surface-secondary)]/50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[var(--muted)]">Filter:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs px-2.5 py-1 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)]"
            >
              <option value="all">All Categories ({activeScenario.budgetItems.length})</option>
              <option value="venue">Venue</option>
              <option value="catering">Catering</option>
              <option value="decoration">Decoration</option>
              <option value="photography">Photography</option>
              <option value="entertainment">Entertainment</option>
              <option value="contingency">Contingency</option>
              <option value="transport">Transport</option>
              <option value="equipment">Equipment</option>
            </select>
          </div>

          <span className="text-xs text-[var(--muted)]">
            Showing {filteredItems.length} items • All figures in INR (₹)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--surface-secondary)] text-xs font-semibold text-[var(--muted)] border-b border-[var(--border)] uppercase">
              <tr>
                <th className="py-3 px-4">Line Item & Source</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Cost Type</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Amount (₹)</th>
                <th className="py-3 px-4 text-right">Deposit Paid</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-[var(--surface-secondary)]/40 transition-colors">
                  <td className="py-3 px-4">
                    <p className="font-semibold text-[var(--foreground)]">{item.name}</p>
                    <p className="text-xs text-[var(--muted)] mt-0.5">
                      {item.sourceNote || (item.isGenerated ? 'Generated estimate' : 'User entry')}
                    </p>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--surface-secondary)] text-[var(--foreground)] font-medium">
                      {getCategoryLabel(item.category)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs text-[var(--muted)]">
                    {item.costType === 'per_person' ? (
                      <span>
                        Per-Person ({item.unitCount || activeScenario.guestCount} × {item.unitRatePaise ? formatPaise(item.unitRatePaise) : '—'})
                      </span>
                    ) : (
                      'Fixed'
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <Badge
                      variant={
                        item.status === 'paid'
                          ? 'success'
                          : item.status === 'committed'
                          ? 'info'
                          : item.status === 'quoted'
                          ? 'accent'
                          : 'default'
                      }
                    >
                      {item.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-[var(--foreground)]">
                    {formatPaise(item.amountPaise)}
                  </td>
                  <td className="py-3 px-4 text-right text-xs text-[var(--muted)]">
                    {item.depositPaise ? formatPaise(item.depositPaise) : '₹0'}
                  </td>
                  <td className="py-3 px-4 text-center space-x-2">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="text-xs text-[var(--primary)] hover:underline font-semibold"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="text-xs text-[var(--danger)] hover:underline font-semibold"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? 'Edit Budget Item' : 'Add New Budget Item'}
      >
        <form onSubmit={handleSaveItem} className="space-y-4">
          <Input
            label="Item Name"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            placeholder="e.g. Sangeet Sound System, Bridal Makeup"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value as BudgetCategory)}
              options={[
                { value: 'venue', label: 'Venue' },
                { value: 'catering', label: 'Catering' },
                { value: 'decoration', label: 'Decoration' },
                { value: 'photography', label: 'Photography' },
                { value: 'entertainment', label: 'Entertainment' },
                { value: 'transport', label: 'Transport' },
                { value: 'equipment', label: 'Equipment' },
                { value: 'attire', label: 'Attire' },
                { value: 'invitations', label: 'Invitations' },
                { value: 'gifts', label: 'Gifts' },
                { value: 'contingency', label: 'Contingency' },
                { value: 'other', label: 'Other' },
              ]}
            />

            <Select
              label="Cost Structure"
              value={costType}
              onChange={(e) => setCostType(e.target.value as CostType)}
              options={[
                { value: 'fixed', label: 'Fixed Cost' },
                { value: 'per_person', label: 'Per Guest / Unit' },
              ]}
            />
          </div>

          {costType === 'per_person' ? (
            <Input
              label="Rate Per Guest (₹)"
              type="number"
              value={unitRateInput}
              onChange={(e) => setUnitRateInput(e.target.value)}
              placeholder="e.g. 1200"
              helpText={`Total for ${activeScenario.guestCount} guests: ₹${(Number(unitRateInput || 0) * activeScenario.guestCount).toLocaleString('en-IN')}`}
              required
            />
          ) : (
            <Input
              label="Total Cost Amount (₹)"
              type="number"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              placeholder="e.g. 75000"
              required
            />
          )}

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value as CostStatus)}
              options={[
                { value: 'estimated', label: 'Estimated' },
                { value: 'quoted', label: 'Quoted by Vendor' },
                { value: 'committed', label: 'Committed Contract' },
                { value: 'paid', label: 'Fully Paid' },
              ]}
            />

            <Input
              label="Deposit Paid (₹)"
              type="number"
              value={depositInput}
              onChange={(e) => setDepositInput(e.target.value)}
              placeholder="0"
            />
          </div>

          <Input
            label="Source Note / Traceability"
            value={sourceNote}
            onChange={(e) => setSourceNote(e.target.value)}
            placeholder="e.g. Vendor quotation Q-102, Market estimate"
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border)]">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editingItem ? 'Save Changes' : 'Add Item'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
