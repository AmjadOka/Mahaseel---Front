"use client";

import { useRef, useState } from "react";
import Alert from "@/components/Alert";
import ConfirmDialog from "@/components/confirm-dialog/ConfirmDialog";
import Field from "@/components/field/Field";
import { SelectField, TextAreaField } from "@/components/field/Fields";
import PageHead from "@/components/ui/PageHead";
import { ROLE } from "@/lib/enums";
import { useT } from "@/lib/i18n/LocaleProvider";
import adminDict from "../admin.i18n";
import { adminMutate, unwrapData, useAdminAction } from "../admin-api";
import dict from "./broadcast.i18n";
import UserPicker, { type PickedUser } from "./UserPicker";

type Audience = "everyone" | "role" | "specific";
type Result = { sent: number; failed: number };

export default function Broadcast() {
  const t = useT(dict);
  const ta = useT(adminDict);
  const act = useAdminAction();
  const [audience, setAudience] = useState<Audience>("everyone");
  const [role, setRole] = useState("BUYER");
  const [picked, setPicked] = useState<PickedUser[]>([]);
  const [v, setV] = useState({
    titleAr: "",
    bodyAr: "",
    titleEn: "",
    bodyEn: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  // Filled by the send callback. Reading a local variable there would make TypeScript narrow it
  // to null, and the result check after the call would not compile.
  const received = useRef<Result | null>(null);
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) =>
    setV((s) => ({ ...s, [k]: e.target.value }));

  const idList = picked.map((u) => u.id);
  // BroadcastNotificationDto needs `title` and `body` (2+ chars): fall back to the other language
  const title = (v.titleEn || v.titleAr).trim();
  const body = (v.bodyEn || v.bodyAr).trim();

  function review() {
    setError(null);
    if (title.length < 2 || body.length < 2) return setError(t("errText"));
    if (audience === "specific" && idList.length === 0) {
      return setError(t("errNoIds"));
    }
    setConfirming(true);
  }

  async function send() {
    const payload = {
      title,
      body,
      titleAr: (v.titleAr || v.titleEn).trim() || undefined,
      bodyAr: (v.bodyAr || v.bodyEn).trim() || undefined,
      ...(audience === "specific"
        ? { userIds: idList }
        : audience === "role"
        ? { role: ROLE[role as keyof typeof ROLE] }
        : {}),
    };

    received.current = null;
    const ok = await act.run(async () => {
      received.current = unwrapData<Result>(
        await adminMutate("POST", "/notifications/broadcast", payload)
      );
    });
    setConfirming(false);
    if (ok && received.current) setResult(received.current);
  }

  if (result) {
    return (
      <div className="max-w-xl space-y-5">
        <PageHead title={t("title")} />
        <Alert tone="success">
          {t("result", { sent: result.sent, failed: result.failed })}
        </Alert>
        <button
          type="button"
          onClick={() => {
            setResult(null);
            setPicked([]);
            setV({ titleAr: "", bodyAr: "", titleEn: "", bodyEn: "" });
          }}
          className="btn btn-solid"
        >
          {t("again")}
        </button>
      </div>
    );
  }

  const radio = (a: Audience, label: string) => (
    <label
      key={a}
      className={`flex flex-1 cursor-pointer items-center justify-center rounded-xl border px-4 py-3 text-sm transition-colors ${
        audience === a
          ? "border-grove bg-grove-soft font-medium text-grove"
          : "border-line hover:border-grove"
      }`}
    >
      <input
        type="radio"
        name="audience"
        checked={audience === a}
        onChange={() => setAudience(a)}
        className="sr-only"
      />
      {label}
    </label>
  );

  return (
    <div className="max-w-2xl space-y-6">
      <PageHead title={t("title")} sub={t("sub")} />
      {(error || act.error) && <Alert tone="error">{error ?? act.error}</Alert>}

      <div>
        <span className="mb-2 block text-sm font-medium">{t("audience")}</span>
        <div className="flex flex-wrap gap-3">
          {radio("everyone", t("everyone"))}
          {radio("role", t("byRole"))}
          {radio("specific", t("specific"))}
        </div>
      </div>
      {audience === "role" && (
        <SelectField
          label={t("role")}
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          {(["BUYER", "MERCHANT"] as const).map((r) => (
            <option key={r} value={r}>
              {t(r)}
            </option>
          ))}
        </SelectField>
      )}
      {audience === "specific" && (
        <UserPicker
          value={picked}
          onChange={setPicked}
          labels={{
            search: t("searchUsers"),
            empty: t("noUsers"),
            selected: t("selectedUsers"),
            selectAll: t("selectAllShown"),
            clear: t("clearSelection"),
          }}
        />
      )}

      <p className="text-sm text-muted">{t("langHint")}</p>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label={t("titleAr")}
          value={v.titleAr}
          onChange={set("titleAr")}
        />
        <Field
          label={t("titleEn")}
          ltr
          value={v.titleEn}
          onChange={set("titleEn")}
        />
        <TextAreaField
          label={t("bodyAr")}
          rows={4}
          value={v.bodyAr}
          onChange={set("bodyAr")}
        />
        <TextAreaField
          label={t("bodyEn")}
          rows={4}
          value={v.bodyEn}
          onChange={set("bodyEn")}
          className="[direction:ltr]"
        />
      </div>

      <button
        type="button"
        onClick={review}
        className="btn btn-solid h-12 px-8"
      >
        {t("send")}
      </button>

      <ConfirmDialog
        open={confirming}
        title={t("confirmTitle")}
        body={
          audience === "everyone"
            ? t("confirmEveryone")
            : audience === "role"
            ? t("confirmRole")
            : t("confirmSpecific", { n: idList.length })
        }
        confirmLabel={act.busy ? t("sending") : t("send")}
        cancelLabel={ta("cancel")}
        busy={act.busy}
        onConfirm={() => void send()}
        onClose={() => !act.busy && setConfirming(false)}
      />
    </div>
  );
}
