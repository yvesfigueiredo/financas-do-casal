import React from "react";

// ============================================================
// BADGE
// ============================================================

type BadgeVariant = "income" | "expense" | "neutral" | "info" | "warning";

const badgeClasses: Record<BadgeVariant, string> = {
  income: "bg-emerald-100 text-emerald-700",
  expense: "bg-red-100 text-red-700",
  neutral: "bg-slate-100 text-slate-600",
  info: "bg-blue-100 text-blue-700",
  warning: "bg-amber-100 text-amber-700",
};

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = "neutral", children, className = "" }: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        badgeClasses[variant],
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}

// ============================================================
// EMPTY STATE
// ============================================================

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && (
        <div className="mb-4 text-slate-300 [&>svg]:w-12 [&>svg]:h-12">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-slate-600">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-slate-400 max-w-xs">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ============================================================
// LOADING SPINNER
// ============================================================

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <div
      className={[
        "inline-block w-6 h-6 border-2 border-slate-200 border-t-brand-600 rounded-full animate-spin",
        className,
      ].join(" ")}
    />
  );
}

// ============================================================
// PAGE LOADER
// ============================================================

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[300px]">
      <Spinner className="w-8 h-8" />
    </div>
  );
}

// ============================================================
// ERROR MESSAGE
// ============================================================

export function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
      {message}
    </div>
  );
}
