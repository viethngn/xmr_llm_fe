import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import type { Message, Conversation, InsertConversation } from "@shared/schema";

export function useChat(conversationId: number | null) {
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['/api/conversations', conversationId, 'messages'],
    queryFn: async () => {
      if (!conversationId) return [];
      const response = await apiRequest('GET', `/api/conversations/${conversationId}/messages`);
      return response.json() as Promise<Message[]>;
    },
    enabled: !!conversationId
  });

  const createConversationMutation = useMutation({
    mutationFn: async (data: InsertConversation) => {
      const response = await apiRequest('POST', '/api/conversations', data);
      return response.json() as Promise<Conversation>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
    }
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { message: string; conversationId: number; dataSourceId: number }) => {
      const response = await apiRequest('POST', '/api/chat', data);
      return response.json() as Promise<Message>;
    },
    onSuccess: (newMessage) => {
      // Update the messages cache
      queryClient.setQueryData(
        ['/api/conversations', conversationId, 'messages'],
        (oldMessages: Message[] = []) => [...oldMessages, newMessage]
      );
      setError(null);
    },
    onError: (error: any) => {
      setError(error.message || 'Failed to send message');
    }
  });

  const sendMessage = async (data: { message: string; conversationId: number; dataSourceId: number }) => {
    setError(null);
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
