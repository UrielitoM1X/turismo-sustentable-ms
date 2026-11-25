import React, { useRef, useState } from "react";
import { catalogService } from "../../../api/services/catalogService";
import { useAuth } from "../../../context/AuthContext";
import { useCatalog } from "../../../context/CatalogContext";
import { useLanguage } from "../../../i18n/LanguageContext";
import { CDMX_BOROUGH_COORDS } from "../../../shared/constants/catalog";

interface UseCreateExperienceFormOptions {
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  onAuditsChanged: () => Promise<void>;
}

const ALLOWED_EXTENSIONS = new Set(["pdf", "jpg", "jpeg", "png", "webp"]);
const MAX_FILE_BYTES = 10 * 1024 * 1024;

export function useCreateExperienceForm({
  onSuccess,
  onError,
  onAuditsChanged,
}: UseCreateExperienceFormOptions) {
  const { session } = useAuth();
  const { reloadCatalog } = useCatalog();
  const { t } = useLanguage();

  const [businessName, setBusinessName] = useState(session.name || t("provider.defaultBiz"));
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Naturaleza");
  const [borough, setBorough] = useState("Xochimilco");
  const [price, setPrice] = useState(650);
  const [duration, setDuration] = useState(180);
  const [capacity, setCapacity] = useState(10);
  const [practices, setPractices] = useState(() => t("provider.defaultPractices"));
  const [petFriendly, setPetFriendly] = useState(true);
  const [accessible, setAccessible] = useState(true);
  const [evidenceFiles, setEvidenceFiles] = useState<FileList | null>(null);
  const [createdAuditId, setCreatedAuditId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const evidenceInputRef = useRef<HTMLInputElement | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const titleTrim = title.trim();
      const descTrim = description.trim();
      const practicesTrim = practices.trim();

      if (titleTrim.length < 5) throw new Error(t("provider.errTitle"));
      if (descTrim.length < 20) throw new Error(t("provider.errDesc"));
      if (practicesTrim.length < 10) throw new Error(t("provider.errPractices"));
      if (!createdAuditId && (!evidenceFiles || evidenceFiles.length === 0)) {
        throw new Error(t("provider.errEvidence"));
      }

      if (!createdAuditId && evidenceFiles) {
        if (evidenceFiles.length > 10) throw new Error(t("provider.errMaxFiles"));
        for (const file of Array.from(evidenceFiles)) {
          const ext = file.name.split(".").pop()?.toLowerCase() || "";
          if (!ALLOWED_EXTENSIONS.has(ext)) {
            throw new Error(t("provider.errFileExt", { name: file.name }));
          }
          if (file.size > MAX_FILE_BYTES) {
            throw new Error(t("provider.errFileTooLarge", { name: file.name }));
          }
        }
      }

      let auditId = createdAuditId;
      if (!auditId) {
        const auditRes = await catalogService.submitAuditEvidence(
          `${businessName.trim()} — ${titleTrim}`,
          category,
          `${descTrim} | Prácticas sustentables: ${practicesTrim} (${borough}, CDMX)`,
          Array.from(evidenceFiles!)
        );
        auditId = auditRes.audit_id;
        setCreatedAuditId(auditId);
      }

      const coords = CDMX_BOROUGH_COORDS[borough] || { lat: 19.4326, lng: -99.1332 };

      await catalogService.createExperience({
        title: titleTrim,
        description: descTrim,
        category,
        borough_cdmx: borough,
        latitude: coords.lat,
        longitude: coords.lng,
        price: Number(price),
        duration_minutes: Number(duration),
        max_capacity: Math.min(50, Math.max(1, Number(capacity))),
        pet_friendly: petFriendly,
        accessible,
        sustainable_practices: practicesTrim,
      });

      const filesCount = evidenceFiles?.length || 1;
      setCreatedAuditId(null);
      setTitle("");
      setDescription("");
      setEvidenceFiles(null);
      if (evidenceInputRef.current) {
        evidenceInputRef.current.value = "";
      }

      await onAuditsChanged();
      await reloadCatalog();
      onSuccess(
        t("provider.submitSuccess", {
          title: titleTrim,
          files: filesCount,
          id: auditId ?? "",
        })
      );
    } catch (err: any) {
      onError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    businessName,
    setBusinessName,
    title,
    setTitle,
    description,
    setDescription,
    category,
    setCategory,
    borough,
    setBorough,
    price,
    setPrice,
    duration,
    setDuration,
    capacity,
    setCapacity,
    practices,
    setPractices,
    petFriendly,
    setPetFriendly,
    accessible,
    setAccessible,
    setEvidenceFiles,
    createdAuditId,
    isSubmitting,
    evidenceInputRef,
    handleSubmit,
  };
}
