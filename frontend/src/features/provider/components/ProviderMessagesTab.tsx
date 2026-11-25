import React from "react";
import { MessageSquare, RefreshCw, Send } from "lucide-react";
import { ChatMessage, ConversationSummary } from "../../../api/services/socialService";
import { useLanguage } from "../../../i18n/LanguageContext";
import { SelectedConversation } from "../hooks/useProviderChat";

interface ProviderMessagesTabProps {
  conversations: ConversationSummary[];
  loading: boolean;
  error: string;
  selectedConv: SelectedConversation | null;
  messages: ChatMessage[];
  replyText: string;
  setReplyText: (value: string) => void;
  replySending: boolean;
  replyError: string;
  onRefresh: () => void;
  onSelectConversation: (experienceId: number, otherUserId: number) => void;
  onSendReply: (e: React.FormEvent) => Promise<void>;
}

export default function ProviderMessagesTab({
  conversations,
  loading,
  error,
  selectedConv,
  messages,
  replyText,
  setReplyText,
  replySending,
  replyError,
  onRefresh,
  onSelectConversation,
  onSendReply,
}: ProviderMessagesTabProps) {
  const { t } = useLanguage();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white dark:bg-[#2A312C] rounded-3xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl font-bold flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#728C69]" />
            {t("provider.conversations")}
          </h2>
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="text-xs text-[#728C69] hover:underline flex items-center gap-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            {t("common.refresh")}
          </button>
        </div>

        {error && (
          <p className="text-xs text-red-600 bg-red-50 dark:bg-red-950/30 p-3 rounded-xl">
            {error}
          </p>
        )}

        {loading ? (
          <p className="text-xs text-muted-foreground">{t("provider.convsLoading")}</p>
        ) : conversations.length === 0 ? (
          <p className="text-xs text-muted-foreground">{t("provider.convsEmpty")}</p>
        ) : (
          <div className="space-y-2">
            {conversations.map((c, idx) => {
              const expId = Number(c.experienceId ?? c.experience_id ?? 0);
              const otherId = Number(c.otherUserId ?? c.other_user_id ?? c.touristId ?? 0);
              const preview = c.lastMessage ?? c.last_message ?? c.content ?? "";
              const isSelected =
                selectedConv?.experienceId === expId && selectedConv?.otherUserId === otherId;
              return (
                <button
                  key={`${expId}-${otherId}-${idx}`}
                  type="button"
                  onClick={() => onSelectConversation(expId, otherId)}
                  className={`w-full text-left p-3 rounded-2xl text-xs transition-colors ${
                    isSelected
                      ? "bg-[#728C69] text-white"
                      : "bg-[#F4F1EA] dark:bg-[#18201C] hover:bg-[#E3E5D8] dark:hover:bg-[#3D453F]"
                  }`}
                >
                  <div className="font-bold">
                    {t("provider.convLabel", { tourist: otherId, exp: expId })}
                  </div>
                  {preview && <p className="truncate opacity-80 mt-0.5">{preview}</p>}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="md:col-span-2 bg-white dark:bg-[#2A312C] rounded-3xl p-6 shadow-sm flex flex-col justify-between min-h-[340px]">
        {!selectedConv ? (
          <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground text-center">
            {t("provider.selectConv")}
          </div>
        ) : (
          <>
            <div>
              <h3 className="font-serif text-lg font-bold mb-3">
                {t("provider.chatHeader", {
                  tourist: selectedConv.otherUserId,
                  exp: selectedConv.experienceId,
                })}
              </h3>
              <div className="bg-[#F4F1EA] dark:bg-[#18201C] rounded-2xl p-4 max-h-64 overflow-y-auto space-y-2 mb-4">
                {messages.length === 0 ? (
                  <p className="text-xs text-muted-foreground">{t("provider.chatNoMsgs")}</p>
                ) : (
                  messages.map((m, idx) => (
                    <div
                      key={m._id || idx}
                      className="bg-white dark:bg-[#2A312C] rounded-xl p-2.5 text-xs"
                    >
                      <span className="font-bold text-[#728C69] block mb-0.5">
                        {m.senderRole === "PROVIDER"
                          ? t("provider.youCoop")
                          : t("detail.touristLabel", { id: m.senderId })}
                      </span>
                      <span>{m.content}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {replyError && <p className="text-xs text-red-600 mb-2">{replyError}</p>}

            <form onSubmit={onSendReply} className="flex gap-2">
              <input
                required
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={t("provider.replyPlaceholder")}
                className="flex-1 bg-[#F4F1EA] dark:bg-[#18201C] rounded-xl px-3 h-10 text-xs"
              />
              <button
                disabled={replySending}
                type="submit"
                className="bg-[#C81D77] hover:bg-[#A91864] text-white px-4 rounded-xl text-xs font-medium flex items-center gap-1.5 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                {replySending ? t("common.sending") : t("provider.replyBtn")}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
