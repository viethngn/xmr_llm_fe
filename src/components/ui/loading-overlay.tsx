import { Card } from "@/components/ui/card";

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
}

export default function LoadingOverlay({ isVisible, message = "Processing..." }: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-50 flex items-center justify-center z-50">
      <Card className="p-6 max-w-sm mx-4">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <div>
            <div className="font-medium text-slate-800">Processing your query...</div>
            <div className="text-sm text-slate-600">{message}</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
