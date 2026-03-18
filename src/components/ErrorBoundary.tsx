import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary]', error, info.componentStack);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 py-16 px-6 text-center">
          <AlertTriangle className="w-12 h-12 text-warning" />
          <h2 className="text-lg font-bold">{this.props.fallbackTitle || '오류가 발생했습니다'}</h2>
          <p className="text-sm text-muted-foreground max-w-md">
            일시적인 문제일 수 있습니다. 아래 버튼을 눌러 다시 시도해주세요.
          </p>
          <Button variant="outline" className="rounded-xl gap-2" onClick={this.handleRetry}>
            <RefreshCw className="w-4 h-4" />
            다시 시도
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
