"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import Alert from "@/components/Alert";
import Field from "@/components/field/Field";
import { useApiError } from "@/lib/api/useApiError";
import { useT } from "@/lib/i18n/LocaleProvider";
import dict from "./farms.i18n";
import { createFarm, updateFarm, type FarmInput } from "./farms-api";
import type { Farm } from "./types";

type Errors = Partial<Record<"name" | "displayName" | "managerName" | "contactPhone" | "latitude" | "longitude", string>>;
const PHONE = /^\+?[0-9][0-9\s-]{6,17}$/;

/** Empty input is undefined, meaning "not given". Anything else must parse as a number. */
const parseCoord = (s: string) => (s.trim() === "" ? undefined : Number(s));

export default function FarmForm({ farm, justCreated }: { farm?: Farm; justCreated?: boolean }) {
  const t = useT(dict);
  const apiError = useApiError();
  const router = useRouter();
  const qc = useQueryClient();

  const [v, setV] = useState({
    name: farm?.name ?? "",
    displayName: farm?.displayName ?? "",
    managerName: farm?.managerName ?? "",
    contactPhone: farm?.contactPhone ?? "",
    locationText: farm?.locationText ?? "",
    agRegistryNo: farm?.agRegistryNo ?? "",
    latitude: farm?.latitude != null ? String(farm.latitude) : "",
    longitude: farm?.longitude != null ? String(farm.longitude) : "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) => setV((s) => ({ ...s, [k]: e.target.value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    const next: Errors = {};
    if (v.name.trim().length < 2) next.name = t("errName");
    if (v.displayName.trim().length < 2) next.displayName = t("errName");
    if (v.managerName.trim().length < 2) next.managerName = t("errManager");
    if (!PHONE.test(v.contactPhone.trim())) next.contactPhone = t("errPhone");

    const lat = parseCoord(v.latitude);
    const lng = parseCoord(v.longitude);
    if (lat !== undefined && !Number.isFinite(lat)) next.latitude = t("errNumber");
    else if (lat !== undefined && (lat < -90 || lat > 90)) next.latitude = t("errLatRange");
    if (lng !== undefined && !Number.isFinite(lng)) next.longitude = t("errNumber");
    else if (lng !== undefined && (lng < -180 || lng > 180)) next.longitude = t("errLngRange");
    // The server accepts the pair together or neither. Catch a lone value here.
    if (!next.latitude && !next.longitude && (lat === undefined) !== (lng === undefined)) {
      if (lat === undefined) next.latitude = t("errCoordsPair");
      else next.longitude = t("errCoordsPair");
    }

    setErrors(next);
    setFormError(null);
    setSaved(false);
    if (Object.keys(next).length) return;

    // On edit, a cleared text field is sent as "" so the server clears it. Left undefined, the
    // server keeps the old value. On create, empty means not given.
    const body: FarmInput = {
      name: v.name.trim(),
      displayName: v.displayName.trim(),
      managerName: v.managerName.trim(),
      contactPhone: v.contactPhone.trim(),
      locationText: farm ? v.locationText.trim() : v.locationText.trim() || undefined,
      agRegistryNo: farm ? v.agRegistryNo.trim() : v.agRegistryNo.trim() || undefined,
      latitude: lat,
      longitude: lng,
    };
    setBusy(true);
    try {
      if (farm) {
        await updateFarm(farm.id, body);
        setSaved(true);
        void qc.invalidateQueries({ queryKey: ["farms"] });
        void qc.invalidateQueries({ queryKey: ["farm", farm.id] });
      } else {
        const created = await createFarm(body);
        void qc.invalidateQueries({ queryKey: ["farms"] });
        router.replace(created?.id ? `/merchant/farms/${created.id}?created=1` : "/merchant/farms");
      }
    } catch (err) {
      setFormError(apiError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="max-w-2xl space-y-5">
      {justCreated && <Alert tone="success">{t("createdNotice")}</Alert>}
      {saved && <Alert tone="success">{t("saved")}</Alert>}
      {formError && <Alert tone="error">{formError}</Alert>}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={t("name")} value={v.name} onChange={set("name")} error={errors.name} maxLength={150} />
        <Field label={t("displayName")} value={v.displayName} onChange={set("displayName")} error={errors.displayName} maxLength={150} />
        <Field label={t("managerName")} value={v.managerName} onChange={set("managerName")} error={errors.managerName} maxLength={100} />
        <Field label={t("contactPhone")} type="tel" ltr autoComplete="tel" value={v.contactPhone} onChange={set("contactPhone")} error={errors.contactPhone} hint={t("contactPhoneHint")} />
      </div>
      <Field label={t("locationText")} placeholder={t("locationPlaceholder")} value={v.locationText} onChange={set("locationText")} />
      <Field label={t("agRegistryNo")} ltr value={v.agRegistryNo} onChange={set("agRegistryNo")} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={t("latitude")} inputMode="decimal" ltr value={v.latitude} onChange={set("latitude")} error={errors.latitude} hint={t("coordsHint")} />
        <Field label={t("longitude")} inputMode="decimal" ltr value={v.longitude} onChange={set("longitude")} error={errors.longitude} />
      </div>

      <button type="submit" disabled={busy} className="btn btn-solid h-12 px-8">
        {busy && <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
        {busy ? t("saving") : farm ? t("save") : t("create")}
      </button>
    </form>
  );
}
