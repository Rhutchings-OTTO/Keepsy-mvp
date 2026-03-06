"use client";

import React, { Component, type ErrorInfo, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
};

type State = { hasError: boolean; error?: Error };

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.props.onError?.(error, errorInfo);
    if (process.env.NODE_ENV !== "production") {
      console.error("[ErrorBoundary]", error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-black/10 bg-white/80 p-8 text-center">
          <p className="text-sm font-semibold text-black/70">This preview isn&apos;t available on your device.</p>
          <p className="text-xs text-black/50">The rest of the shop works — try another section.</p>
        </div>
      );
    }
    return this.props.children;
  }
}
