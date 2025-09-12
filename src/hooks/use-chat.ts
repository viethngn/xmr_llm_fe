import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, post } from "@/lib/api";
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
      return post<Message>('/chat', payload);
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

  const sendMessage = async (data: { content: string; conversationId: number }) => {
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
