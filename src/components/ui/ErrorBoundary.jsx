import React from "react";
import Toast from "./Toast";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error("[React Error Boundary]", {
      message: error?.message || "Unknown error",
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 flex items-center justify-center bg-app">
          <div className="max-w-sm rounded-lg border border-app-2 bg-app-2 p-6 text-center">
            <h1 className="mb-2 text-lg font-bold text-app">
              Something went wrong
            </h1>
            <p className="mb-4 text-sm text-app-3">
              {this.state.error?.message ||
                "An unexpected error occurred. Please refresh the page."}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg bg-[var(--accent)] px-4 py-2 font-semibold text-white transition-opacity duration-200 hover:opacity-85"
            >
              Refresh Page
            </button>
          </div>
          <Toast />
        </div>
      );
    }

    return this.props.children;
  }
}
