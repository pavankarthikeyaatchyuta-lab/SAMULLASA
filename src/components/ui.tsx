'use client';

import React from 'react';

// ─── Button ───────────────────────────────────────────────────────────────────

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-[var(--radius-md)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)] disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)]',
    secondary: 'bg-[var(--accent)] text-[var(--accent-foreground)] hover:bg-[var(--accent-hover)]',
    outline: 'border-2 border-[var(--border)] bg-transparent text-[var(--foreground)] hover:bg-[var(--surface-secondary)]',
    ghost: 'bg-transparent text-[var(--foreground)] hover:bg-[var(--surface-secondary)]',
    danger: 'bg-[var(--danger)] text-white hover:bg-red-800',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ children, className = '', padding = 'md' }: CardProps) {
  const paddings = { none: '', sm: 'p-3', md: 'p-5', lg: 'p-6' };
  return (
    <div className={`bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] shadow-sm ${paddings[padding]} ${className}`}>
      {children}
    </div>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helpText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helpText, id, className = '', ...props }, ref) => {
    const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, '-')}`;
    const errorId = `${inputId}-error`;
    const helpId = `${inputId}-help`;

    return (
      <div className="space-y-1">
        <label htmlFor={inputId} className="block text-sm font-medium text-[var(--foreground)]">
          {label}
          {props.required && <span className="text-[var(--danger)] ml-1" aria-hidden="true">*</span>}
        </label>
        <input
          ref={ref}
          id={inputId}
          className={`w-full px-3 py-2 border rounded-[var(--radius-md)] text-sm bg-[var(--surface)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] transition-colors focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] ${error ? 'border-[var(--danger)]' : 'border-[var(--border)]'} ${className}`}
          aria-invalid={!!error}
          aria-describedby={`${error ? errorId : ''} ${helpText ? helpId : ''}`.trim() || undefined}
          {...props}
        />
        {helpText && !error && (
          <p id={helpId} className="text-xs text-[var(--muted)]">{helpText}</p>
        )}
        {error && (
          <p id={errorId} className="text-xs text-[var(--danger)]" role="alert">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

// ─── Select ───────────────────────────────────────────────────────────────────

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function Select({ label, error, options, placeholder, id, className = '', ...props }: SelectProps) {
  const selectId = id || `select-${label.toLowerCase().replace(/\s+/g, '-')}`;
  const errorId = `${selectId}-error`;

  return (
    <div className="space-y-1">
      <label htmlFor={selectId} className="block text-sm font-medium text-[var(--foreground)]">
        {label}
        {props.required && <span className="text-[var(--danger)] ml-1" aria-hidden="true">*</span>}
      </label>
      <select
        id={selectId}
        className={`w-full px-3 py-2 border rounded-[var(--radius-md)] text-sm bg-[var(--surface)] text-[var(--foreground)] transition-colors focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] ${error ? 'border-[var(--danger)]' : 'border-[var(--border)]'} ${className}`}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && (
        <p id={errorId} className="text-xs text-[var(--danger)]" role="alert">{error}</p>
      )}
    </div>
  );
}

// ─── Textarea ─────────────────────────────────────────────────────────────────

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

export function Textarea({ label, error, id, className = '', ...props }: TextareaProps) {
  const textareaId = id || `textarea-${label.toLowerCase().replace(/\s+/g, '-')}`;
  const errorId = `${textareaId}-error`;

  return (
    <div className="space-y-1">
      <label htmlFor={textareaId} className="block text-sm font-medium text-[var(--foreground)]">
        {label}
        {props.required && <span className="text-[var(--danger)] ml-1" aria-hidden="true">*</span>}
      </label>
      <textarea
        id={textareaId}
        className={`w-full px-3 py-2 border rounded-[var(--radius-md)] text-sm bg-[var(--surface)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] transition-colors focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] ${error ? 'border-[var(--danger)]' : 'border-[var(--border)]'} ${className}`}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        {...props}
      />
      {error && (
        <p id={errorId} className="text-xs text-[var(--danger)]" role="alert">{error}</p>
      )}
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'accent';
  className?: string;
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const variants = {
    default: 'bg-[var(--surface-secondary)] text-[var(--foreground)]',
    success: 'bg-[var(--success-bg)] text-[var(--success)]',
    warning: 'bg-[var(--warning-bg)] text-[var(--warning)]',
    danger: 'bg-[var(--danger-bg)] text-[var(--danger)]',
    info: 'bg-[var(--info-bg)] text-[var(--info)]',
    accent: 'bg-[var(--accent-light)] text-[var(--accent)]',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

interface ProgressBarProps {
  value: number; // 0-100
  max?: number;
  label: string;
  showValue?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  className?: string;
}

export function ProgressBar({ value, max = 100, label, showValue = true, variant = 'default', className = '' }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const colors = {
    default: 'bg-[var(--primary)]',
    success: 'bg-[var(--success)]',
    warning: 'bg-[var(--warning)]',
    danger: 'bg-[var(--danger)]',
  };

  return (
    <div className={className}>
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium">{label}</span>
        {showValue && <span className="text-[var(--muted)]">{Math.round(pct)}%</span>}
      </div>
      <div
        className="w-full h-2 bg-[var(--surface-secondary)] rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ${colors[variant]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      {icon && <div className="text-[var(--muted-foreground)] mb-4">{icon}</div>}
      <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">{title}</h3>
      <p className="text-sm text-[var(--muted)] max-w-md mb-6">{description}</p>
      {action}
    </div>
  );
}

// ─── Modal/Dialog ─────────────────────────────────────────────────────────────

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
      window.addEventListener('keydown', handleEsc);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleEsc);
      };
    }
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="fixed inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className={`relative bg-[var(--surface)] rounded-[var(--radius-xl)] shadow-xl w-full ${sizes[size]} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
          <h2 id="modal-title" className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-[var(--radius-sm)] hover:bg-[var(--surface-secondary)] text-[var(--muted)]"
            aria-label="Close dialog"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

interface TabsProps {
  tabs: { id: string; label: string; count?: number }[];
  activeTab: string;
  onTabChange: (id: string) => void;
}

export function Tabs({ tabs, activeTab, onTabChange }: TabsProps) {
  return (
    <div className="border-b border-[var(--border)]" role="tablist">
      <div className="flex gap-0 -mb-px overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
            id={`tab-${tab.id}`}
            onClick={() => onTabChange(tab.id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'border-[var(--primary)] text-[var(--primary)]'
                : 'border-transparent text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--border)]'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${
                activeTab === tab.id ? 'bg-[var(--primary-light)] text-[var(--primary)]' : 'bg-[var(--surface-secondary)]'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Status Indicator ─────────────────────────────────────────────────────────

interface StatusIndicatorProps {
  status: string;
  label: string;
}

export function StatusIndicator({ status, label }: StatusIndicatorProps) {
  const getVariant = (): { color: string; icon: string } => {
    switch (status) {
      case 'completed':
      case 'confirmed':
      case 'approved':
      case 'paid':
        return { color: 'text-[var(--success)]', icon: '✓' };
      case 'in_progress':
      case 'planning':
      case 'quoted':
      case 'committed':
        return { color: 'text-[var(--info)]', icon: '●' };
      case 'pending':
      case 'draft':
      case 'estimated':
      case 'shortlisted':
        return { color: 'text-[var(--warning)]', icon: '○' };
      case 'blocked':
      case 'cancelled':
      case 'rejected':
        return { color: 'text-[var(--danger)]', icon: '✗' };
      default:
        return { color: 'text-[var(--muted)]', icon: '·' };
    }
  };

  const { color, icon } = getVariant();
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm ${color}`}>
      <span aria-hidden="true">{icon}</span>
      <span>{label}</span>
    </span>
  );
}

// ─── Alert ────────────────────────────────────────────────────────────────────

interface AlertProps {
  variant: 'info' | 'success' | 'warning' | 'danger';
  title?: string;
  children: React.ReactNode;
  onDismiss?: () => void;
}

export function Alert({ variant, title, children, onDismiss }: AlertProps) {
  const variants = {
    info: 'bg-[var(--info-bg)] border-[var(--info)] text-[var(--info)]',
    success: 'bg-[var(--success-bg)] border-[var(--success)] text-[var(--success)]',
    warning: 'bg-[var(--warning-bg)] border-[var(--warning)] text-[var(--warning)]',
    danger: 'bg-[var(--danger-bg)] border-[var(--danger)] text-[var(--danger)]',
  };

  return (
    <div
      className={`border-l-4 rounded-[var(--radius-md)] p-4 ${variants[variant]}`}
      role="alert"
    >
      <div className="flex items-start justify-between">
        <div>
          {title && <p className="font-semibold mb-1">{title}</p>}
          <div className="text-sm">{children}</div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="ml-3 p-1 hover:opacity-70"
            aria-label="Dismiss alert"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
