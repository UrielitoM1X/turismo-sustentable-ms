import React, { useCallback, useState } from "react";
import {
  ChatMessage,
  ConversationSummary,
  socialService,
} from "../../../api/services/socialService";
import { useLanguage } from "../../../i18n/LanguageContext";

export interface SelectedConversation {
  experienceId: number;
  otherUserId: number;
}

export function useProviderChat() {
  const { t } = useLanguage();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedConv, setSelectedConv] = useState<SelectedConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [replyText, setReplyText] = useState("");
  const [replySending, setReplySending] = useState(false);
  const [replyError, setReplyError] = useState("");

  const loadConversations = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const list = await socialService.getConversations();
      setConversations(list);
    } catch (err: any) {
      setError(err.message || t("provider.convsLoadError"));
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  const loadHistory = useCallback(
    async (experienceId: number, otherUserId: number) => {
      setReplyError("");
      try {
        const list = await socialService.getConversationHistory(experienceId, otherUserId);
        setMessages(list);
      } catch (err: any) {
        setReplyError(err.message || t("provider.chatLoadError"));
        setMessages([]);
      }
    },
    [t]
  );

  const selectConversation = (experienceId: number, otherUserId: number) => {
    setSelectedConv({ experienceId, otherUserId });
    loadHistory(experienceId, otherUserId);
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConv || !replyText.trim()) return;

    setReplySending(true);
    setReplyError("");
    try {
      await socialService.sendMessage(
        selectedConv.experienceId,
        selectedConv.otherUserId,
        replyText.trim()
      );
      setReplyText("");
      await loadHistory(selectedConv.experienceId, selectedConv.otherUserId);
      await loadConversations();
    } catch (err: any) {
      setReplyError(err.message || t("provider.replySendError"));
    } finally {
      setReplySending(false);
    }
  };

  return {
    conversations,
    loading,
    error,
    selectedConv,
    messages,
    replyText,
    setReplyText,
    replySending,
    replyError,
    loadConversations,
    selectConversation,
    handleSendReply,
  };
}
