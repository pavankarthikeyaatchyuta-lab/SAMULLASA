'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { formatPaise, getCategoryLabel } from '@/lib/budget-engine';
import { Card, Button, Input, Select, Badge, Modal, EmptyState } from '@/components/ui';
import type { Vendor, VendorStatus, BudgetCategory } from '@/types/events';

export default function VendorsPage() {
  const { state, dispatch, getCurrentScenario } = useStore();
  const [selectedEventId, setSelectedEventId] = useState<string>(
    state.events[0]?.id || '',
  );

  const activeEvent = state.events.find((e) => e.id === selectedEventId) || state.events[0];
  const activeScenario = activeEvent ? getCurrentScenario(activeEvent.id) : undefined;

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState<BudgetCategory>('catering');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [quotedPriceInput, setQuotedPriceInput] = useState('');
  const [depositPaidInput, setDepositPaidInput] = useState('');
  const [inclusionsInput, setInclusionsInput] = useState('');
  const [exclusionsInput, setExclusionsInput] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [status, setStatus] = useState<VendorStatus>('quoted');

  const handleOpenAdd = () => {
    setEditingVendor(null);
    setName('');
    setCategory('catering');
    setContactName('');
    setPhone('');
    setEmail('');
    setQuotedPriceInput('');
    setDepositPaidInput('');
    setInclusionsInput('');
    setExclusionsInput('');
    setPaymentTerms('50% advance, 50% post-event');
    setStatus('quoted');
    setModalOpen(true);
  };

  const handleOpenEdit = (v: Vendor) => {
    setEditingVendor(v);
    setName(v.name);
    setCategory(v.category);
    setContactName(v.contactName || '');
    setPhone(v.phone || '');
    setEmail(v.email || '');
    setQuotedPriceInput(v.quotedPricePaise ? (v.quotedPricePaise / 100).toString() : '');
    setDepositPaidInput(v.depositPaidPaise ? (v.depositPaidPaise / 100).toString() : '');
    setInclusionsInput(v.inclusions.join(', '));
    setExclusionsInput(v.exclusions.join(', '));
    setPaymentTerms(v.paymentTerms || '');
    setStatus(v.status);
    setModalOpen(true);
  };

  const handleSaveVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeScenario) return;

    const quotedPaise = quotedPriceInput ? Math.round(Number(quotedPriceInput) * 100) : undefined;
    const depositPaise = depositPaidInput ? Math.round(Number(depositPaidInput) * 100) : 0;
    const balancePaise = quotedPaise ? Math.max(0, quotedPaise - depositPaise) : 0;

    const inclusions = inclusionsInput.split(',').map((s) => s.trim()).filter(Boolean);
    const exclusions = exclusionsInput.split(',').map((s) => s.trim()).filter(Boolean);

    if (editingVendor) {
      dispatch({
        type: 'UPDATE_VENDOR',
        payload: {
          scenarioId: activeScenario.id,
          vendorId: editingVendor.id,
          updates: {
            name,
            category,
            contactName,
            phone,
            email,
            quotedPricePaise: quotedPaise,
            depositPaidPaise: depositPaise,
            balanceDuePaise: balancePaise,
            inclusions,
            exclusions,
            paymentTerms,
            status,
            updatedAt: new Date().toISOString(),
          },
        },
      });
    } else {
      const newVendor: Vendor = {
        id: crypto.randomUUID(),
        name,
        category,
        contactName,
        phone,
        email,
        quotedPricePaise: quotedPaise,
        depositPaidPaise: depositPaise,
        balanceDuePaise: balancePaise,
        inclusions,
        exclusions,
        paymentTerms,
        status,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      dispatch({
        type: 'ADD_VENDOR',
        payload: {
          scenarioId: activeScenario.id,
          vendor: newVendor,
        },
      });
    }

    setModalOpen(false);
  };

  const handleDeleteVendor = (vendorId: string) => {
    if (!activeScenario) return;
    if (confirm('Delete this vendor record?')) {
      dispatch({
        type: 'REMOVE_VENDOR',
        payload: {
          scenarioId: activeScenario.id,
          vendorId,
        },
      });
    }
  };

  if (!activeEvent || !activeScenario) {
    return (
      <EmptyState
        title="No Event Selected"
        description="Please create or load an event to access vendor records."
        action={
          <Button onClick={() => dispatch({ type: 'LOAD_SAMPLE_DATA' })} variant="primary">
            Load Sample Event
          </Button>
        }
      />
    );
  }

  const vendors = activeScenario.vendors;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[var(--border)]">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Vendor Workspace</h1>
          <p className="text-sm text-[var(--muted)]">
            Manage quotations, checklists, inclusions, and payment contracts
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
            + Add Vendor Record
          </Button>
        </div>
      </div>

      {/* Vendor Cards Grid */}
      {vendors.length === 0 ? (
        <EmptyState
          title="No Vendors Recorded"
          description="Track caterers, decorators, photographers, and sound providers with structured quotations and payment balances."
          action={
            <Button onClick={handleOpenAdd} variant="primary">
              + Add First Vendor
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vendors.map((vendor) => (
            <Card key={vendor.id} padding="lg" className="flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--surface-secondary)] text-[var(--foreground)]">
                    {getCategoryLabel(vendor.category)}
                  </span>
                  <Badge
                    variant={
                      vendor.status === 'confirmed' || vendor.status === 'booked'
                        ? 'success'
                        : vendor.status === 'quoted'
                        ? 'accent'
                        : vendor.status === 'shortlisted'
                        ? 'info'
                        : 'default'
                    }
                  >
                    {vendor.status.toUpperCase()}
                  </Badge>
                </div>

                <h3 className="text-lg font-bold text-[var(--foreground)]">{vendor.name}</h3>
                {vendor.contactName && (
                  <p className="text-xs text-[var(--muted)] mt-0.5">
                    Contact: {vendor.contactName} {vendor.phone ? `(${vendor.phone})` : ''}
                  </p>
                )}

                <div className="my-4 p-3 bg-[var(--surface-secondary)] rounded-[var(--radius-md)] space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">Quoted Price:</span>
                    <strong className="text-[var(--foreground)] text-sm">
                      {vendor.quotedPricePaise ? formatPaise(vendor.quotedPricePaise) : 'Pending Quote'}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">Deposit Paid:</span>
                    <span className="text-[var(--success)] font-medium">
                      {vendor.depositPaidPaise ? formatPaise(vendor.depositPaidPaise) : '₹0'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">Balance Due:</span>
                    <span className="text-[var(--primary)] font-bold">
                      {vendor.balanceDuePaise ? formatPaise(vendor.balanceDuePaise) : '₹0'}
                    </span>
                  </div>
                </div>

                {vendor.inclusions.length > 0 && (
                  <div className="text-xs mb-2">
                    <span className="font-semibold text-[var(--foreground)]">Inclusions:</span>
                    <ul className="list-disc list-inside text-[var(--muted)] mt-1 space-y-0.5">
                      {vendor.inclusions.slice(0, 3).map((inc, i) => (
                        <li key={i}>{inc}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {vendor.paymentTerms && (
                  <p className="text-xs text-[var(--muted)] italic mt-2">
                    Terms: {vendor.paymentTerms}
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-[var(--border)] flex justify-between items-center mt-4">
                <Button size="sm" variant="outline" onClick={() => handleOpenEdit(vendor)}>
                  Edit Quotation
                </Button>
                <button
                  onClick={() => handleDeleteVendor(vendor.id)}
                  className="text-xs text-[var(--danger)] hover:underline p-1"
                >
                  Delete
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingVendor ? 'Edit Vendor Quotation' : 'Add Vendor Quotation'}
      >
        <form onSubmit={handleSaveVendor} className="space-y-4">
          <Input
            label="Vendor / Business Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Royal Decorators, Sri Meenakshi Caterers"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Service Category"
              value={category}
              onChange={(e) => setCategory(e.target.value as BudgetCategory)}
              options={[
                { value: 'catering', label: 'Catering' },
                { value: 'venue', label: 'Venue' },
                { value: 'decoration', label: 'Decoration' },
                { value: 'photography', label: 'Photography' },
                { value: 'entertainment', label: 'Entertainment' },
                { value: 'transport', label: 'Transport' },
                { value: 'equipment', label: 'Equipment' },
                { value: 'other', label: 'Other' },
              ]}
            />

            <Select
              label="Engagement Status"
              value={status}
              onChange={(e) => setStatus(e.target.value as VendorStatus)}
              options={[
                { value: 'shortlisted', label: 'Shortlisted' },
                { value: 'contacted', label: 'Contacted' },
                { value: 'quoted', label: 'Quotation Received' },
                { value: 'booked', label: 'Booked' },
                { value: 'confirmed', label: 'Confirmed / Contracted' },
                { value: 'rejected', label: 'Rejected' },
              ]}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Contact Person"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="e.g. Rajesh Kumar"
            />
            <Input
              label="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
            />
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contact@vendor.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Quoted Total Amount (₹)"
              type="number"
              value={quotedPriceInput}
              onChange={(e) => setQuotedPriceInput(e.target.value)}
              placeholder="e.g. 250000"
            />
            <Input
              label="Deposit Paid (₹)"
              type="number"
              value={depositPaidInput}
              onChange={(e) => setDepositPaidInput(e.target.value)}
              placeholder="0"
            />
          </div>

          <Input
            label="Inclusions (Comma separated)"
            value={inclusionsInput}
            onChange={(e) => setInclusionsInput(e.target.value)}
            placeholder="e.g. 3-tier mandap, stage backdrop, welcome gate, entrance florals"
          />

          <Input
            label="Exclusions (Comma separated)"
            value={exclusionsInput}
            onChange={(e) => setExclusionsInput(e.target.value)}
            placeholder="e.g. Generator fuel, additional lighting after 11pm"
          />

          <Input
            label="Payment Terms & Milestone Conditions"
            value={paymentTerms}
            onChange={(e) => setPaymentTerms(e.target.value)}
            placeholder="e.g. 25% token advance, 50% on event morning, 25% post event"
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border)]">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editingVendor ? 'Save Quotation' : 'Add Vendor'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
