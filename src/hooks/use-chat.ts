import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, post } from "@/lib/api";
import { apiLogger } from "@/lib/logger";
import type { Message, Conversation, InsertConversation, InsertMessage } from "@/types/shared";

export function useChat(conversationId: number | null) {
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['/api/conversations', conversationId, 'messages'],
    queryFn: async () => {
      if (!conversationId) return [];
      return get<Message[]>(`/conversations/${conversationId}/messages`);
    },
    enabled: !!conversationId
  });

  const createConversationMutation = useMutation({
    mutationFn: async (data: InsertConversation) => {
      return post<Conversation>('/conversations', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
    }
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { content: string; conversationId: number }) => {
      const payload: InsertMessage = { conversationId: data.conversationId, role: 'user', content: data.content };
      
      // Log chat message details
      apiLogger.chat(data.conversationId, data.content);
      
      return post<Message>('/chat', payload);
    },
    onSuccess: (assistantMessage) => {
      // Log assistant response details
      apiLogger.chat(conversationId || 0, 'Assistant Response', assistantMessage);
      
      // Add the assistant's response to the cache
      queryClient.setQueryData(
        ['/api/conversations', conversationId, 'messages'],
        (oldMessages: Message[] = []) => [...oldMessages, assistantMessage]
      );
      setError(null);
    },
    onError: (error: any) => {
      apiLogger.error('POST', '/chat', error);
      setError(error.message || 'Failed to send message');
    }
  });

  const sendMessage = async (data: { content: string; conversationId: number }) => {
    setError(null);
    
    // Add user message to cache immediately for better UX
    const userMessage: Message = {
      id: Date.now(), // Temporary ID
      conversationId: data.conversationId,
      role: 'user',
      content: data.content,
      createdAt: new Date().toISOString()
    };
    
    queryClient.setQueryData(
      ['/api/conversations', conversationId, 'messages'],
      (oldMessages: Message[] = []) => [...oldMessages, userMessage]
    );
    
    return sendMessageMutation.mutateAsync(data);
  };

  const createConversation = async (data: InsertConversation) => {
    return createConversationMutation.mutateAsync(data);
  };

  return {
    messages,
    sendMessage,
    createConversation,
    isLoading: messagesLoading || sendMessageMutation.isPending,
    error
  };
}
