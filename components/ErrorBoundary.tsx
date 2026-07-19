import { Component, ReactNode, ErrorInfo } from "react";
import Link from "next/link";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto max-w-lg px-6 py-24 text-center">
          <div className="inline-flex items-center gap-2 rounded-none border border-danger/40 bg-danger-soft px-4 py-2 font-terminal text-xs text-danger">
            <span className="term-err">[!]</span> একটি সমস্যা হয়েছে
          </div>
          <h1 className="mt-6 font-display text-2xl font-semibold text-text-primary">
            কিছু একটা ভুল হয়েছে
          </h1>
          <p className="mt-3 font-code text-sm leading-relaxed text-text-muted">
            পৃষ্ঠাটি লোড করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।
          </p>
          {process.env.NODE_ENV === "development" && this.state.error && (
            <pre className="mt-6 rounded-md border border-border bg-elevated p-4 text-left font-mono text-xs text-danger overflow-auto max-h-40">
              {this.state.error.message}
              {this.state.error.stack && `\n\n${this.state.error.stack}`}
            </pre>
          )}
          <div className="mt-8 flex flex-col items-center gap-3">
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                if (typeof window !== "undefined") window.location.reload();
              }}
              className="btn-primary"
            >
              আবার চেষ্টা করুন
            </button>
            <Link href="/" className="btn-ghost">
              হোমে ফিরে যান
            </Link>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
