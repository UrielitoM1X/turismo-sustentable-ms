import React, { useCallback, useEffect, useState } from "react";
import { Experience } from "../../../api/services/catalogService";
import { ChatMessage, socialService } from "../../../api/services/socialService";
import { useAuth } from "../../../context/AuthContext";

export function useExperienceChat(experience: Experience | null) {
  const { session, isTourist } = useAuth();

  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const loadHistory = useCallback(
    async (exp: Experience) => {
      if (!session.token) return;
      const otherId = exp.provider_id || 1;
      try {
        const messages = await socialService.getConversationHistory(exp.id, otherId);
        setHistory(messages);
      } catch {
        setHistory([]);
      }
    },
    [session.token]
  );

  useEffect(() => {
    setHistory([]);
    setError("");
    setText("");
    if (experience && session.token && isTourist) {
      loadHistory(experience);
    }
  }, [experience, session.token, isTourist, loadHistory]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!experience || !text.trim()) return;

    setSending(true);
    setError("");
    const recipientId = experience.provider_id || 1;
    try {
      await socialService.sendMessage(experience.id, recipientId, text.trim());
      setText("");
      await loadHistory(experience);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return {
    history,
    text,
    setText,
    sending,
    error,
    handleSend,
  };
}
