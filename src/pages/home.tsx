import { useState, useEffect } from "react";
import ChatInterface from "@/components/chat/chat-interface";
import ConversationSidebar from "@/components/sidebar/conversation-sidebar";
import QueryResultsPanel from "@/components/results/query-results-panel";
import DatabaseModal from "@/components/modals/database-modal";
import CsvUploadModal from "@/components/modals/csv-upload-modal";
import LoadingOverlay from "@/components/ui/loading-overlay";
import { useDataSources } from "@/hooks/use-data-sources";
import { Settings, User } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [selectedDataSourceId, setSelectedDataSourceId] = useState<number | null>(null);
  const [showDatabaseModal, setShowDatabaseModal] = useState(false);
  const [showCsvUploadModal, setShowCsvUploadModal] = useState(false);
  const [showResultsPanel, setShowResultsPanel] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState("");

  const { data: dataSources = [], isLoading: dataSourcesLoading } = useDataSources();

  // Set default data source if available
  useEffect(() => {
    if (dataSources.length > 0 && !selectedDataSourceId) {
      setSelectedDataSourceId(dataSources[0].id);
    }
  }, [dataSources, selectedDataSourceId]);

  const connectedDataSource = dataSources.find(ds => ds.status === 'active');

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-slate-800">XMR Data Insights</h1>
          </div>
          
          {connectedDataSource && (
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-slate-600">Connected to {connectedDataSource.name}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-slate-300 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-slate-600" />
            </div>
            <span className="text-sm font-medium text-slate-700">Demo User</span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <ConversationSidebar 
          onConversationSelect={setSelectedConversationId}
          onDataSourceSelect={setSelectedDataSourceId}
          onAddDataSource={() => setShowDatabaseModal(true)}
          selectedConversationId={selectedConversationId}
          selectedDataSourceId={selectedDataSourceId}
        />

        {/* Main Chat Interface */}
        <ChatInterface 
          conversationId={selectedConversationId}
          dataSourceId={selectedDataSourceId}
          onConversationCreate={setSelectedConversationId}
          onProcessingChange={setIsProcessing}
          onProcessingMessageChange={setProcessingMessage}
          onUploadCsv={() => setShowCsvUploadModal(true)}
          onAddDatabase={() => setShowDatabaseModal(true)}
        />

        {/* Results Panel */}
        {showResultsPanel && (
          <QueryResultsPanel 
            onToggle={() => setShowResultsPanel(!showResultsPanel)}
          />
        )}
      </div>

      {/* Modals and Overlays */}
      <DatabaseModal 
        open={showDatabaseModal}
        onOpenChange={setShowDatabaseModal}
      />
      
      <CsvUploadModal 
        open={showCsvUploadModal}
        onOpenChange={setShowCsvUploadModal}
      />

      <LoadingOverlay 
        isVisible={isProcessing}
        message={processingMessage}
      />
    </div>
  );
}
