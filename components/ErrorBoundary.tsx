"use client";

import React from "react";

interface State { hasError: boolean }

export default class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.warn("ErrorBoundary caught:", error.message);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#191E29] flex flex-col items-center justify-center px-6 text-center">
          <p className="text-white text-xl font-bold mb-2">Something went wrong</p>
          <p className="text-[#606E79] text-sm mb-8">Tap below to reload the app.</p>
          <button
            onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
            className="bg-[#01C38D] text-[#191E29] font-bold px-8 py-4 rounded-2xl"
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
