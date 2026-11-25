import React, { useEffect, useState } from "react";
import { useLanguage } from "../../../i18n/LanguageContext";
import ProviderAccountTab, { ProviderTab } from "../components/ProviderAccountTab";
import ProviderAuditsList from "../components/ProviderAuditsList";
import ProviderCreateExperienceForm from "../components/ProviderCreateExperienceForm";
import ProviderMessagesTab from "../components/ProviderMessagesTab";
import ProviderMonitoringView from "../components/ProviderMonitoringView";
import { useCreateExperienceForm } from "../hooks/useCreateExperienceForm";
import { useProviderAudits } from "../hooks/useProviderAudits";
import { useProviderChat } from "../hooks/useProviderChat";

interface ProviderPortalPageProps {
  initialTab?: ProviderTab;
}

export default function ProviderPortalPage({
  initialTab = "cuenta",
}: ProviderPortalPageProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<ProviderTab>(initialTab);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  const auditsState = useProviderAudits();
  const chatState = useProviderChat();
  const form = useCreateExperienceForm({
    onAuditsChanged: auditsState.loadAudits,
    onSuccess: (text) => {
      setFeedback({ type: "success", text });
      setActiveTab("solicitudes");
    },
    onError: (text) => {
      setFeedback({ type: "error", text });
    },
  });

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (activeTab === "solicitudes" || activeTab === "monitoreo") {
      auditsState.loadAudits();
    }
    if (activeTab === "mensajes") {
      chatState.loadConversations();
    }
  }, [activeTab]);

  const tabs: { id: ProviderTab; label: string }[] = [
    { id: "cuenta", label: t("provider.tabAccount") },
    { id: "monitoreo", label: t("provider.tabMonitoring") },
    { id: "nuevaExp", label: t("provider.tabNew") },
    { id: "solicitudes", label: t("provider.tabAudits", { count: auditsState.audits.length }) },
    { id: "mensajes", label: t("provider.tabMessages") },
  ];

  return (
    <main className="flex-1 w-full bg-[#F4F1EA] dark:bg-[#18201C] transition-colors duration-300 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-wrap bg-[#E3E5D8] dark:bg-[#2A312C] p-1 rounded-xl mb-8 max-w-3xl">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setFeedback(null);
                setActiveTab(tab.id);
              }}
              className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-white dark:bg-[#3D453F] text-[#1E201D] dark:text-white shadow-sm"
                  : "text-[#63665E] dark:text-[#A5B29A]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {feedback && (
          <div
            className={`p-4 rounded-xl text-xs mb-6 text-center font-medium ${
              feedback.type === "success"
                ? "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300 border border-green-300"
                : "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300 border border-red-300"
            }`}
          >
            {feedback.text}
          </div>
        )}

        {activeTab === "cuenta" && (
          <ProviderAccountTab
            businessName={form.businessName}
            category={form.category}
            borough={form.borough}
            onSelectTab={setActiveTab}
          />
        )}

        {activeTab === "monitoreo" && (
          <ProviderMonitoringView
            audits={auditsState.audits}
            onCreateNew={() => setActiveTab("nuevaExp")}
          />
        )}

        {activeTab === "nuevaExp" && <ProviderCreateExperienceForm form={form} />}

        {activeTab === "solicitudes" && (
          <ProviderAuditsList
            audits={auditsState.audits}
            loading={auditsState.loading}
            error={auditsState.error}
            onRefresh={auditsState.loadAudits}
            onCreateNew={() => setActiveTab("nuevaExp")}
          />
        )}

        {activeTab === "mensajes" && (
          <ProviderMessagesTab
            conversations={chatState.conversations}
            loading={chatState.loading}
            error={chatState.error}
            selectedConv={chatState.selectedConv}
            messages={chatState.messages}
            replyText={chatState.replyText}
            setReplyText={chatState.setReplyText}
            replySending={chatState.replySending}
            replyError={chatState.replyError}
            onRefresh={chatState.loadConversations}
            onSelectConversation={chatState.selectConversation}
            onSendReply={chatState.handleSendReply}
          />
        )}
      </div>
    </main>
  );
}
