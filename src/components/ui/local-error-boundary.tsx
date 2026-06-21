"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

import { MaintenanceMessage } from "@/components/ui/maintenance-message";

/* Tightly wrap a NON-critical widget (reviews, Q&A, recommendations, video rail)
   so a crash inside it never blanks the whole page. On a render error it swaps
   only that subtree for a compact maintenance card; the rest of the page stays
   100% shoppable. Catches thrown render errors only — widgets that fail soft to
   an empty state keep doing so and never reach here. */

interface Props {
  children: ReactNode;
  /** Identifies which widget crashed, for logs. */
  label?: string;
  /** Override the default inline maintenance card. */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class LocalErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log loudly with context so a prod crash in a minor widget is debuggable.
    console.error(
      `[LocalErrorBoundary${this.props.label ? `:${this.props.label}` : ""}]`,
      error,
      info,
    );
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? <MaintenanceMessage variant="inline" />;
    }
    return this.props.children;
  }
}
