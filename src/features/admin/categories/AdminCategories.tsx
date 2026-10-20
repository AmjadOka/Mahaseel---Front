"use client";

import { Fragment, useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ImageIcon, Loader2 } from "lucide-react";
import Alert from "@/components/Alert";
import ConfirmDialog from "@/components/confirm-dialog/ConfirmDialog";
import Dialog from "@/components/dialog/Dialog";
import Field from "@/components/field/Field";
import { SelectField } from "@/components/field/Fields";
import Badge from "@/components/ui/Badge";
import PageHead from "@/components/ui/PageHead";
import QueryState from "@/components/ui/QueryState";
import { cld } from "@/lib/cloudinary";
import { useLocale, useT } from "@/lib/i18n/LocaleProvider";
import { loadCategoryTree } from "@/features/market/categories";
import { categoryName } from "@/features/market/format";
import type { Category } from "@/features/market/types";
import adminDict from "../admin.i18n";
import { adminForm, adminGet, adminMutate, useAdminAction } from "../admin-api";
import dict from "./categories.i18n";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
type Editing = { cat: Category | null; parentId: string } | null;

/** CreateCategoryDto / UpdateCategoryDto: nameAr, nameEn (2–100), slug (a-z0-9-), parentId, sortOrder ≥ 0, isActive. */
function CategoryForm({
  editing,
  roots,
  onDone,
}: {
  editing: NonNullable<Editing>;
  roots: Category[];
  onDone: () => void;
}) {
  const t = useT(dict);
  const ta = useT(adminDict);
  const act = useAdminAction();
  const qc = useQueryClient();
  const c = editing.cat;
  const [v, setV] = useState({
    nameAr: c?.nameAr ?? "",
    nameEn: c?.nameEn ?? "",
    slug: c?.slug ?? "",
    parentId: c ? c.parentId ?? "" : editing.parentId,
    sortOrder: String(c?.sortOrder ?? 0),
    isActive: c?.isActive ?? true,
  });
  const [errors, setErrors] = useState<
    Partial<Record<"nameAr" | "nameEn" | "slug", string>>
  >({});
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) =>
    setV((s) => ({ ...s, [k]: e.target.value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (v.nameAr.trim().length < 2) next.nameAr = t("errName");
    if (v.nameEn.trim().length < 2) next.nameEn = t("errName");
    if (v.slug.trim() && !SLUG.test(v.slug.trim())) next.slug = t("errSlug");
    setErrors(next);
    if (Object.keys(next).length) return;
    const body = {
      nameAr: v.nameAr.trim(),
      nameEn: v.nameEn.trim(),
      slug: v.slug.trim() || undefined,
      parentId: v.parentId || null,
      sortOrder: Math.max(0, Math.floor(Number(v.sortOrder) || 0)),
      isActive: v.isActive,
    };
    const ok = await act.run(() =>
      c
        ? adminMutate("PATCH", `/categories/${c.id}`, body)
        : adminMutate("POST", "/categories", body)
    );
    if (ok) {
      void qc.invalidateQueries({ queryKey: ["categories"] }); // the public tree
      onDone();
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      {act.error && <Alert tone="error">{act.error}</Alert>}
      <Field
        label={t("nameAr")}
        value={v.nameAr}
        onChange={set("nameAr")}
        error={errors.nameAr}
        maxLength={100}
      />
      <Field
        label={t("nameEn")}
        ltr
        value={v.nameEn}
        onChange={set("nameEn")}
        error={errors.nameEn}
        maxLength={100}
      />
      <Field
        label={t("slug")}
        ltr
        value={v.slug}
        onChange={set("slug")}
        error={errors.slug}
        hint={t("slugHint")}
      />
      <SelectField
        label={t("parent")}
        value={v.parentId}
        onChange={set("parentId")}
      >
        <option value="">{t("noParent")}</option>
        {roots
          .filter((r) => r.id !== c?.id)
          .map((r) => (
            <option key={r.id} value={r.id}>
              {r.nameEn ?? r.nameAr}
            </option>
          ))}
      </SelectField>
      <Field
        label={t("sortOrder")}
        type="number"
        min={0}
        ltr
        value={v.sortOrder}
        onChange={set("sortOrder")}
      />
      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={v.isActive}
          onChange={(e) => setV((s) => ({ ...s, isActive: e.target.checked }))}
          className="size-4 accent-[var(--grove)]"
        />
        {t("isActive")}
      </label>
      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onDone}
          disabled={act.busy}
          className="btn btn-line"
        >
          {ta("cancel")}
        </button>
        <button type="submit" disabled={act.busy} className="btn btn-solid">
          {act.busy && (
            <Loader2
              className="size-4 animate-spin motion-reduce:animate-none"
              aria-hidden="true"
            />
          )}
          {act.busy ? t("saving") : t("save")}
        </button>
      </div>
    </form>
  );
}

export default function AdminCategories() {
  const t = useT(dict);
  const ta = useT(adminDict);
  const { locale } = useLocale();
  const act = useAdminAction();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Editing>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);

  // The admin list. The public /categories hides inactive categories, which would leave an admin
  // with no way to show a hidden one again.
  const q = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: () => loadCategoryTree((p) => adminGet(p), { activeOnly: false }),
  });

  const run = async (fn: () => Promise<unknown>) => {
    const ok = await act.run(fn);
    if (ok) void qc.invalidateQueries({ queryKey: ["categories"] });
    return ok;
  };

  const icon = (c: Category, file: File | undefined) => {
    if (!file) return;
    const f = new FormData();
    f.append("icon", file);
    void run(() => adminForm("PATCH", `/categories/${c.id}/icon`, f));
  };

  const row = (c: Category, depth: number) => (
    <tr key={c.id} className="align-middle">
      <td className="px-4 py-3">
        <div
          className="flex items-center gap-3"
          style={{ paddingInlineStart: `${depth * 1.5}rem` }}
        >
          <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-grove-soft text-grove/50">
            {c.iconUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- Cloudinary already serves resized images
              <img
                src={cld(c.iconUrl, 80)}
                alt=""
                className="size-full object-cover"
              />
            ) : (
              <ImageIcon className="size-4" aria-hidden="true" />
            )}
          </span>
          <div>
            <p className="font-medium">{categoryName(c, locale)}</p>
            <p className="text-xs text-muted">
              {locale === "ar" ? c.nameEn : c.nameAr}
            </p>
          </div>
        </div>
      </td>
      <td className="figure px-4 py-3 text-xs text-muted">{c.slug}</td>
      <td className="figure px-4 py-3">{c.sortOrder ?? 0}</td>
      <td className="px-4 py-3">
        <Badge tone={c.isActive === false ? "stop" : "go"}>
          {c.isActive === false ? t("hidden") : t("active")}
        </Badge>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setEditing({ cat: c, parentId: "" })}
            className="btn btn-line h-8 px-3 text-xs"
          >
            {t("edit")}
          </button>
          <button
            type="button"
            disabled={act.busy}
            onClick={() =>
              void run(() => adminMutate("PATCH", `/categories/${c.id}/toggle`))
            }
            className="btn btn-line h-8 px-3 text-xs"
          >
            {t("toggle")}
          </button>
          {depth === 0 && (
            <button
              type="button"
              onClick={() => setEditing({ cat: null, parentId: c.id })}
              className="btn btn-line h-8 px-3 text-xs"
            >
              {t("addChild")}
            </button>
          )}
          <label className="btn btn-line h-8 cursor-pointer px-3 text-xs">
            {t("changeIcon")}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                icon(c, e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>
          {c.iconUrl && (
            <button
              type="button"
              disabled={act.busy}
              onClick={() =>
                void run(() =>
                  adminMutate("DELETE", `/categories/${c.id}/icon`)
                )
              }
              className="btn btn-line h-8 px-3 text-xs"
            >
              {t("removeIcon")}
            </button>
          )}
          <button
            type="button"
            onClick={() => setDeleting(c)}
            className="btn btn-line h-8 px-3 text-xs text-pomegranate"
          >
            {t("delete")}
          </button>
        </div>
      </td>
    </tr>
  );

  return (
    <div>
      <PageHead
        title={t("title")}
        sub={t("sub")}
        action={
          <button
            type="button"
            onClick={() => setEditing({ cat: null, parentId: "" })}
            className="btn btn-solid"
          >
            {t("add")}
          </button>
        }
      />
      {act.error && !editing && !deleting && (
        <div className="mb-6">
          <Alert tone="error">{act.error}</Alert>
        </div>
      )}
      <QueryState
        q={q}
        isEmpty={(d) => d.length === 0}
        empty={<p className="py-8 text-center text-muted">{t("empty")}</p>}
      >
        {(roots) => (
          <>
            <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
              <table className="w-full min-w-[46rem] text-sm">
                <thead className="border-b border-line bg-grove-soft/50">
                  <tr>
                    {[t("colName"), t("colSlug"), t("colOrder"), "", ""].map(
                      (h, i) => (
                        <th
                          key={i}
                          scope="col"
                          className="px-4 py-3 text-start font-medium text-muted"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {roots.map((r) => (
                    <Fragment key={r.id}>
                      {row(r, 0)}
                      {(r.children ?? []).map((ch) => row(ch, 1))}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            <Dialog
              open={!!editing}
              title={editing?.cat ? t("formEdit") : t("formAdd")}
              onClose={() => setEditing(null)}
              wide
            >
              {editing && (
                <CategoryForm
                  editing={editing}
                  roots={roots}
                  onDone={() => setEditing(null)}
                />
              )}
            </Dialog>
          </>
        )}
      </QueryState>

      <ConfirmDialog
        open={!!deleting}
        title={t("deleteTitle")}
        body={
          deleting
            ? `${categoryName(deleting, locale) ?? ""} — ${t("deleteBody")}`
            : ""
        }
        confirmLabel={t("delete")}
        cancelLabel={ta("cancel")}
        danger
        busy={act.busy}
        onConfirm={async () => {
          if (!deleting) return;
          await run(() => adminMutate("DELETE", `/categories/${deleting.id}`));
          // Close either way. A refusal (the category still has products) shows above the table,
          // and an open dialog would have hidden it.
          setDeleting(null);
        }}
        onClose={() => !act.busy && setDeleting(null)}
      />
    </div>
  );
}
