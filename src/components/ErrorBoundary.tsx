import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface State { hasError: boolean; }

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    // Log only a minimal signature to console — never expose to UI.
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary]", (error as Error)?.name || "Error");
  }

  reset = () => {
    this.setState({ hasError: false });
    // Soft reload of current route only.
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div role="alert" className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="max-w-md text-center space-y-4">
          <div className="inline-flex w-12 h-12 rounded-full bg-destructive/10 items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>
          <h1 className="text-xl font-display font-bold">Something broke on our side</h1>
          <p className="text-sm text-muted-foreground">
            The page hit an unexpected error. Your work is safe — try reloading.
          </p>
          <Button onClick={this.reset}>Reload page</Button>
        </div>
      </div>
    );
  }
}
