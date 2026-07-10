import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * App-level error boundary: a rendering crash anywhere below shows a friendly
 * recovery screen instead of a white page. Class component by necessity —
 * React has no hook equivalent for componentDidCatch.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center px-6 bg-background">
          <div className="max-w-sm text-center">
            <div className="text-6xl mb-4">😵</div>
            <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
            <p className="text-muted-foreground mb-6 text-sm">
              An unexpected error occurred. Reloading usually fixes it — if not, please try
              again in a few minutes.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.assign("/");
              }}
              className="inline-flex h-11 items-center rounded-xl bg-primary px-8 font-semibold text-white shadow-sm transition-all hover:bg-primary/90"
            >
              Reload HariomCoins
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
