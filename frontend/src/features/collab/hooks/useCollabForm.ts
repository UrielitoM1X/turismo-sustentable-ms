import React, { useState } from "react";
import { useLanguage } from "../../../i18n/LanguageContext";

export type OrganizationType =
  | "cooperative"
  | "guide"
  | "ngo"
  | "institution"
  | "other";

export function useCollabForm() {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("");
  const [orgType, setOrgType] = useState<OrganizationType>("cooperative");
  const [borough, setBorough] = useState("Xochimilco");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (name.trim().length < 2) {
      setError(t("collab.errName"));
      return;
    }
    if (!email.includes("@")) {
      setError(t("collab.errEmail"));
      return;
    }
    if (message.trim().length < 15) {
      setError(t("collab.errMessage"));
      return;
    }

    setSubmitted(true);
  };

  const reset = () => {
    setName("");
    setEmail("");
    setOrganization("");
    setOrgType("cooperative");
    setBorough("Xochimilco");
    setMessage("");
    setError("");
    setSubmitted(false);
  };

  return {
    name,
    setName,
    email,
    setEmail,
    organization,
    setOrganization,
    orgType,
    setOrgType,
    borough,
    setBorough,
    message,
    setMessage,
    error,
    submitted,
    handleSubmit,
    reset,
  };
}
