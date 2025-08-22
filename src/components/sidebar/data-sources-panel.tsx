import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useDataSources } from "@/hooks/use-data-sources";
import { Database, FileSpreadsheet, Plus, Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface DataSourcesPanelProps {
  onDataSourceSelect: (id: number) => void;
  onAddDataSource: () => void;
  selectedDataSourceId: number | null;
}

export default function DataSourcesPanel({
  onDataSourceSelect,
  onAddDataSource,
  selectedDataSourceId
}: DataSourcesPanelProps) {
  const { data: dataSources = [], isLoading } = useDataSources();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteDataSourceMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/data-sources/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/data-sources'] });
      toast({
        title: "Data source deleted",
        description: "The data source has been removed successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete data source.",
        variant: "destructive",
      });
    }
  });

  const getDataSourceIcon = (type: string) => {
    switch (type) {
      case 'csv':
        return <FileSpreadsheet className="w-4 h-4" />;
      default:
        return <Database className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-slate-300';
    }
  };

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    deleteDataSourceMutation.mutate(id);
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-16 bg-slate-200 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-slate-700">Data Sources</h3>
        
        {dataSources.length === 0 ? (
          <div className="text-center py-8">
            <Database className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">No data sources</p>
            <p className="text-slate-400 text-xs mt-1">Add a database or upload CSV files</p>
          </div>
        ) : (
          <div className="space-y-2">
            {dataSources.map((dataSource) => (
              <Card
                key={dataSource.id}
                className={`group p-3 cursor-pointer transition-colors hover:bg-slate-50 ${
                  selectedDataSourceId === dataSource.id ? 'ring-2 ring-primary bg-primary/5' : ''
                }`}
                onClick={() => onDataSourceSelect(dataSource.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(dataSource.status)}`}></div>
                    {getDataSourceIcon(dataSource.type)}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-700 truncate">
                        {dataSource.name}
                      </div>
                      <div className="text-xs text-slate-500 capitalize">
                        {dataSource.type} • {dataSource.status}
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleDelete(e, dataSource.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto"
                  >
                    <Trash2 className="w-3 h-3 text-slate-400 hover:text-red-500" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      <Button
        variant="outline"
        className="w-full"
        onClick={onAddDataSource}
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Data Source
      </Button>
    </div>
  );
}
