import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, BarChart3 } from "lucide-react";

interface QueryResultsPanelProps {
  onToggle: () => void;
}

export default function QueryResultsPanel({ onToggle }: QueryResultsPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleToggle = () => {
    setIsCollapsed(!isCollapsed);
    onToggle();
  };

  // Real stats would come from the last query result
  const hasData = false; // Will be true when there's actual data

  if (isCollapsed) {
    return (
      <div className="w-12 bg-white border-l border-slate-200 flex flex-col items-center py-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggle}
          className="p-2"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
        </Button>
      </div>
    );
  }

  return (
    <aside className="w-96 bg-white border-l border-slate-200 flex flex-col">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <h3 className="font-medium text-slate-800">Query Results</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggle}
          className="p-1"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {hasData ? (
          <div>
            {/* Query Summary */}
            <Card className="p-4 bg-slate-50">
              <h4 className="text-sm font-medium text-slate-700 mb-2">Current Query</h4>
              <p className="text-sm text-slate-600">Results will appear here after running a query</p>
            </Card>
            
            {/* Quick Stats would be populated with real data */}
          </div>
        ) : (
          <div className="text-center py-8">
            <BarChart3 className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">No query results yet</p>
            <p className="text-slate-400 text-xs mt-1">Run a query to see statistics and insights</p>
          </div>
        )}
        

      </div>
    </aside>
  );
}
