import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DataSourcesPanel from "./data-sources-panel";
import { Plus, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, del } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { Conversation } from "@shared/schema";

interface ConversationSidebarProps {
  onConversationSelect: (id: number) => void;
  onDataSourceSelect: (id: number) => void;
  onAddDataSource: () => void;
  selectedConversationId: number | null;
  selectedDataSourceId: number | null;
}

export default function ConversationSidebar({
  onConversationSelect,
  onDataSourceSelect,
  onAddDataSource,
  selectedConversationId,
  selectedDataSourceId
}: ConversationSidebarProps) {
  const [activeTab, setActiveTab] = useState("history");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['/api/conversations'],
    queryFn: async () => {
      return get<Conversation[]>('/conversations');
    }
  });

  const deleteConversationMutation = useMutation({
    mutationFn: async (id: number) => {
      await del(`/conversations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      toast({
        title: "Conversation deleted",
        description: "The conversation and all its messages have been removed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete conversation.",
        variant: "destructive",
      });
    }
  });

  const handleDeleteConversation = (e: React.MouseEvent, conversationId: number) => {
    e.stopPropagation();
    deleteConversationMutation.mutate(conversationId);
    
    // If deleting the currently selected conversation, clear selection
    if (selectedConversationId === conversationId) {
      onConversationSelect(null);
    }
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
  };

  return (
    <aside className="w-80 bg-white border-r border-slate-200 flex flex-col">
      <div className="p-6 border-b border-slate-200">
        <Button 
          className="w-full"
          onClick={() => onConversationSelect(null)}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Query
        </Button>
      </div>
      
      {/* Navigation Tabs */}
      <div className="p-4 border-b border-slate-200">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="sources">Sources</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {activeTab === "history" ? (
          <div className="p-4 space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 bg-slate-200 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-500 text-sm">No conversations yet</p>
                <p className="text-slate-400 text-xs mt-1">Start a new query to begin</p>
              </div>
            ) : (
              conversations.map((conversation) => (
                <Card
                  key={conversation.id}
                  className={`p-3 cursor-pointer transition-colors hover:bg-slate-50 group ${
                    selectedConversationId === conversation.id ? 'ring-2 ring-primary bg-primary/5' : ''
                  }`}
                  onClick={() => onConversationSelect(conversation.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-800 truncate">
                        {conversation.title}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {formatTimeAgo(conversation.updatedAt!)}
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDeleteConversation(e, conversation.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto"
                    >
                      <Trash2 className="w-3 h-3 text-slate-400 hover:text-red-500" />
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        ) : (
          <DataSourcesPanel
            onDataSourceSelect={onDataSourceSelect}
            onAddDataSource={onAddDataSource}
            selectedDataSourceId={selectedDataSourceId}
          />
        )}
      </div>
    </aside>
  );
}
