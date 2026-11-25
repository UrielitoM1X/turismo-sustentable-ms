import { useEffect, useState } from "react";
import { authService } from "../../../api/services/authService";
import { useAuth } from "../../../context/AuthContext";
import { useBookings } from "../../../context/BookingsContext";
import { useLanguage } from "../../../i18n/LanguageContext";

const DEFAULT_INTERESTS = ["Naturaleza", "Cultura", "Ecoturismo", "Pet Friendly"];

export function useProfile() {
  const { session, isTourist } = useAuth();
  const { bookings, totalImpactFund, reloadBookings } = useBookings();
  const { t } = useLanguage();

  const [profileName, setProfileName] = useState<string | null>(null);
  const [interests, setInterests] = useState<string[]>(DEFAULT_INTERESTS);
  const [accessibilityNeeds, setAccessibilityNeeds] = useState<string[]>([]);
  const [newInterest, setNewInterest] = useState("");
  const [newAccessibility, setNewAccessibility] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    if (!session.token) return;
    reloadBookings();

    authService
      .getMe()
      .then((me) => {
        if (me?.full_name) setProfileName(me.full_name);
        if (Array.isArray(me?.travel_interests) && me.travel_interests.length > 0) {
          setInterests(me.travel_interests);
        }
        if (Array.isArray(me?.accessibility_needs)) {
          setAccessibilityNeeds(me.accessibility_needs);
        }
      })
      .catch(() => {});
  }, [session.token, reloadBookings]);

  const addInterest = () => {
    const trimmed = newInterest.trim();
    if (!trimmed) return;
    setInterests((prev) => [...prev, trimmed]);
    setNewInterest("");
  };

  const removeInterest = (index: number) => {
    setInterests((prev) => prev.filter((_, i) => i !== index));
  };

  const addAccessibilityNeed = () => {
    const trimmed = newAccessibility.trim();
    if (!trimmed) return;
    setAccessibilityNeeds((prev) => [...prev, trimmed]);
    setNewAccessibility("");
  };

  const removeAccessibilityNeed = (index: number) => {
    setAccessibilityNeeds((prev) => prev.filter((_, i) => i !== index));
  };

  const savePreferences = async () => {
    if (!isTourist) {
      setEditing(false);
      return;
    }

    setSaving(true);
    setFeedback(null);
    try {
      await authService.updatePreferences(interests, accessibilityNeeds);
      setFeedback({ type: "ok", text: t("profile.prefsSaved") });
      setEditing(false);
    } catch (err: any) {
      setFeedback({ type: "err", text: err.message || t("profile.prefsError") });
    } finally {
      setSaving(false);
    }
  };

  const toggleEditOrSave = () => {
    if (editing) {
      savePreferences();
    } else {
      setFeedback(null);
      setEditing(true);
    }
  };

  return {
    profileName,
    bookingsCount: bookings.length,
    totalImpactFund,
    interests,
    accessibilityNeeds,
    newInterest,
    setNewInterest,
    newAccessibility,
    setNewAccessibility,
    editing,
    saving,
    feedback,
    addInterest,
    removeInterest,
    addAccessibilityNeed,
    removeAccessibilityNeed,
    toggleEditOrSave,
  };
}
