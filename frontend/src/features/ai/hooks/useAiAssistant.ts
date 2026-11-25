import React, { useEffect, useState } from "react";
import { aiService } from "../../../api/services/aiService";
import { Experience } from "../../../api/services/catalogService";
import { useLanguage } from "../../../i18n/LanguageContext";
import { translations } from "../../../i18n/translations";

export function useAiAssistant() {
  const { lang, t } = useLanguage();
  const [message, setMessage] = useState(() => t("ai.defaultPrompt"));
  const [reply, setReply] = useState("");
  const [suggestions, setSuggestions] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMessage((prev) => {
      if (
        prev === translations.es["ai.defaultPrompt"] ||
        prev === translations.en["ai.defaultPrompt"]
      ) {
        return translations[lang]["ai.defaultPrompt"];
      }
      return prev;
    });
  }, [lang]);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (trimmed.length < 2) {
      setReply(t("ai.minChars"));
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const res = await aiService.askAssistant(trimmed);
      setReply(res.assistant_reply || JSON.stringify(res));
      setSuggestions(Array.isArray(res.suggested_experiences) ? res.suggested_experiences : []);
    } catch (err: any) {
      setReply(`Error: ${err.message}`);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  return {
    message,
    setMessage,
    reply,
    suggestions,
    loading,
    handleAsk,
  };
}
