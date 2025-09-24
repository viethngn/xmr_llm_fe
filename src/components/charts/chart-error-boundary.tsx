import React from 'react';
import { Card } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

interface ChartErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ChartErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export default class ChartErrorBoundary extends React.Component<ChartErrorBoundaryProps, ChartErrorBoundaryState> {
  constructor(props: ChartErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ChartErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Chart Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="text-center text-red-600">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm font-medium">Chart Rendering Error</p>
            <p className="text-xs mt-1">Something went wrong while rendering the chart</p>
            <details className="mt-2 text-xs text-left">
              <summary className="cursor-pointer">Error Details</summary>
              <pre className="mt-1 p-2 bg-red-100 rounded text-xs overflow-auto">
                {this.state.error?.message || 'Unknown error'}
              </pre>
            </details>
          </div>
        </Card>
      );
    }

    return this.props.children;
  }
}
