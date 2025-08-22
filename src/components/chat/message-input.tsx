import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, Database, Send, Plus } from "lucide-react";

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onNewConversation: () => void;
  onUploadCsv?: () => void;
  onAddDatabase?: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function MessageInput({ 
  value, 
  onChange, 
  onSend, 
  onNewConversation,
  onUploadCsv,
  onAddDatabase,
  disabled = false,
  placeholder = "Ask anything about your data..."
}: MessageInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [rows, setRows] = useState(1);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && value.trim()) {
        onSend();
      }
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    // Auto-resize textarea
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 120); // Max 5 rows
      textarea.style.height = `${newHeight}px`;
      
      const lineHeight = 24;
      const newRows = Math.min(Math.ceil(newHeight / lineHeight), 5);
      setRows(newRows);
    }
  };

  useEffect(() => {
    if (!value && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      setRows(1);
    }
  }, [value]);

  return (
    <div className="border-t border-slate-200 bg-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-end space-x-4">
          <div className="flex-1">
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              rows={rows}
              className="resize-none border-slate-300 focus:border-primary focus:ring-primary"
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
            
            {/* Quick Actions */}
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center space-x-3">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-slate-500 hover:text-slate-700"
                  onClick={onUploadCsv}
                >
                  <Paperclip className="w-4 h-4 mr-1" />
                  Upload CSV
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-slate-500 hover:text-slate-700"
                  onClick={onAddDatabase}
                >
                  <Database className="w-4 h-4 mr-1" />
                  Add Database
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-slate-500 hover:text-slate-700"
                  onClick={onNewConversation}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  New Query
                </Button>
              </div>
              <div className="text-xs text-slate-400">
                Press Enter to send • Shift+Enter for new line
              </div>
            </div>
          </div>
          
          <Button 
            onClick={onSend}
            disabled={disabled || !value.trim()}
            className="p-3"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
