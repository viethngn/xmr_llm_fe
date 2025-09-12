import { useState, useRef, useEffect } from "react";
import MessageList from "./message-list";
import MessageInput from "./message-input";
import { useChat } from "@/hooks/use-chat";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface ChatInterfaceProps {
  conversationId: number | null;
  dataSourceId: number | null;
  onConversationCreate: (id: number) => void;
  onProcessingChange: (processing: boolean) => void;
  onProcessingMessageChange: (message: string) => void;
  onUploadCsv: () => void;
  onAddDatabase: () => void;
}

export default function ChatInterface({ 
  conversationId, 
  dataSourceId, 
  onConversationCreate,
  onProcessingChange,
  onProcessingMessageChange,
  onUploadCsv,
  onAddDatabase
}: ChatInterfaceProps) {
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { 
    messages, 
    sendMessage, 
    createConversation, 
    isLoading,
    error 
  } = useChat(conversationId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    onProcessingChange(isLoading);
    if (isLoading) {
      onProcessingMessageChange("Processing your query...");
    }
  }, [isLoading, onProcessingChange, onProcessingMessageChange]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    if (!dataSourceId) {
      // Show error toast or message
      return;
    }

    let currentConversationId = conversationId;

    // Create conversation if none exists
    if (!currentConversationId) {
      try {
        const newConversation = await createConversation({
          title: inputMessage.slice(0, 50) + (inputMessage.length > 50 ? "..." : "")
        });
        currentConversationId = newConversation.id;
        onConversationCreate(currentConversationId);
      } catch (error) {
        console.error("Failed to create conversation:", error);
        return;
      }
    }

    try {
      await sendMessage({
        content: inputMessage,
        conversationId: currentConversationId
      });
      setInputMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleStartNewConversation = async () => {
    if (!dataSourceId) return;

    try {
      const newConversation = await createConversation({
        title: "New Query"
      });
      onConversationCreate(newConversation.id);
    } catch (error) {
      console.error("Failed to create conversation:", error);
    }
  };

  const suggestedQueries = [
    "What were our top-selling products last quarter?",
    "Show me customer churn rate by segment",
    "Create an XmR chart for monthly revenue"
  ];

  return (
    <main className="flex-1 flex flex-col">
      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {!conversationId && messages.length === 0 ? (
          /* Welcome Message */
          <div className="max-w-3xl">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <Card className="p-4 shadow-sm border-slate-200">
                <p className="text-slate-700 mb-4">
                  Hi! I'm your data assistant. Ask me anything about your business data - I can help you analyze sales, track performance, or create visualizations. Try asking something like:
                </p>
                <div className="space-y-2">
                  {suggestedQueries.map((query, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      className="w-full justify-start h-auto p-3 text-left text-sm bg-slate-50 hover:bg-slate-100"
                      onClick={() => setInputMessage(query)}
                    >
                      "{query}"
                    </Button>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        ) : (
          <MessageList 
            messages={messages} 
            isLoading={isLoading}
            error={error}
          />
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <MessageInput
        value={inputMessage}
        onChange={setInputMessage}
        onSend={handleSendMessage}
        onNewConversation={handleStartNewConversation}
        onUploadCsv={onUploadCsv}
        onAddDatabase={onAddDatabase}
        disabled={isLoading || !dataSourceId}
        placeholder={
          !dataSourceId 
            ? "Please select a data source to start asking questions..." 
            : "Ask anything about your data... (e.g., 'Show me customer churn by region' or 'Create a trend chart for monthly sales')"
        }
      />
    </main>
  );
}
