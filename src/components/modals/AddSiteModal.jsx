import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Toggle from "@/components/ui/Toggle";
import { PrimaryButton } from "@/components/ui/Button";
import useAppStore from "@/hooks/useAppStore";
import { createRouteDefinition } from "@/services/router";
import { ensureSearchUrlMatchesBase } from "@/utils/sites";

export default function AddSiteModal({ open, onClose, editSite = null }) {
  const { sites, addSite, updateSite, devMode, showToast } = useAppStore();

  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [searchUrl, setSearchUrl] = useState("");
  const [prefix, setPrefix] = useState("");
  const [emoji, setEmoji] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [addToQL, setAddToQL] = useState(true);
  const [status, setStatus] = useState({ msg: "", type: "" });
  const [saving, setSaving] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (editSite) {
      setName(editSite.name || "");
      setUrl(editSite.baseUrl || "");
      setSearchUrl(editSite.searchUrl || "");
      setPrefix(editSite.prefix || "");
      setEmoji(editSite.emoji || "");
      setLogoUrl(editSite.logoUrl || "");
      setAddToQL(editSite.ql ?? true);
    } else {
      setName("");
      setUrl("");
      setSearchUrl("");
      setPrefix("");
      setEmoji("");
      setLogoUrl("");
      setAddToQL(true);
    }
    setStatus({ msg: "", type: "" });
  }, [editSite, open]);

  const statusColor =
    status.type === "ok"
      ? "text-success"
      : status.type === "error"
        ? "text-danger"
        : "text-accent";

  async function handleSave() {
    if (!name.trim()) {
      setStatus({ msg: "Enter a site name.", type: "error" });
      return;
    }
    if (!url.trim()) {
      setStatus({ msg: "Enter the website URL.", type: "error" });
      return;
    }

    const cleanPrefix = prefix.trim().toLowerCase().replace(/\s/g, "");
    if (!cleanPrefix) {
      setStatus({ msg: "Enter a shortcut prefix.", type: "error" });
      return;
    }
    const conflict = sites.find(
      (s) => s.prefix === cleanPrefix && s.id !== editSite?.id,
    );
    if (conflict) {
      setStatus({
        msg: `"${cleanPrefix}" is already used by ${conflict.name}.`,
        type: "error",
      });
      return;
    }

    const baseUrl = url.startsWith("http") ? url : "https://" + url;
    setSaving(true);

    if (editSite) {
      // Update existing
      const patch = {
        name: name.trim(),
        prefix: cleanPrefix,
        emoji,
        logoUrl,
        ql: addToQL,
      };
      if (!editSite.builtin || devMode) patch.baseUrl = baseUrl;
      if (devMode) {
        const normalizedTemplate = ensureSearchUrlMatchesBase(
          baseUrl,
          searchUrl.trim(),
        );
        patch.searchUrl = normalizedTemplate;
      }
      updateSite(editSite.id, patch);
      showToast(`${name} updated`);
      setSaving(false);
      onClose();
      return;
    }

    // New site — AI may return either a search template or a direct/open-only route.
    let resolvedSearchUrl = "";
    let shortcutData = null;

    if (devMode && searchUrl.trim()) {
      resolvedSearchUrl = ensureSearchUrlMatchesBase(baseUrl, searchUrl.trim());
    } else {
      setStatus({ msg: "Creating route via Navix API…", type: "loading" });
      try {
        shortcutData = await createRouteDefinition({
          name: name.trim(),
          baseUrl,
          alias: cleanPrefix,
        });

        const routeTemplate = ensureSearchUrlMatchesBase(
          baseUrl,
          shortcutData.template || "",
        );

        if (routeTemplate) {
          resolvedSearchUrl = routeTemplate;
        }

        const routeKind =
          shortcutData.routeType === "search" ? "search" : "open";
        setStatus({
          msg:
            routeKind === "search"
              ? "Navix route ready: search-enabled."
              : "Navix route ready: direct/open navigation.",
          type: "ok",
        });
      } catch {
        setStatus({
          msg: "Navix API could not create a route template. This shortcut will open the site directly.",
          type: "error",
        });
      }
    }

    const newSite = {
      id: "c_" + Date.now(),
      name: name.trim(),
      baseUrl,
      ...(resolvedSearchUrl ? { searchUrl: resolvedSearchUrl } : {}),
      prefix: cleanPrefix,
      emoji,
      logoUrl,
      slugRules:
        shortcutData?.slugRules || shortcutData?.slug_rules || undefined,
      capabilities: shortcutData?.capabilities || undefined,
      routeType:
        shortcutData?.routeType || (resolvedSearchUrl ? "search" : "open"),
      defaultUrl: shortcutData?.defaultUrl || baseUrl,
      bg: "#818cf8",
      ql: addToQL,
      builtin: false,
    };

    addSite(newSite);
    showToast(`✓ ${name} added`);
    setSaving(false);
    onClose();
  }

  const isBuiltinLocked = editSite?.builtin && !devMode;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editSite ? "Edit Site" : "Add Site"}
    >
      <div className="font-app flex flex-col gap-5">
        <Field
          label={
            <>
              Site Name <span className="font-normal text-danger">*</span>
            </>
          }
        >
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Notion"
          />
        </Field>

        <Field
          label={
            <>
              Website URL <span className="font-normal text-danger">*</span>
            </>
          }
          hint={
            isBuiltinLocked
              ? "Switch to Dev Mode to edit built-in URLs."
              : "Navix AI will detect whether this site needs a search template or just a direct URL."
          }
        >
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://notion.so"
            disabled={isBuiltinLocked}
          />
        </Field>

        {devMode && (
          <Field
            label={
              <>
                Search URL{" "}
                <span className="rounded-[20px] bg-[linear-gradient(135deg,#f59e0b,#f97316)] px-[0.45rem] py-[0.12rem] text-[0.6rem] font-bold text-white">
                  Dev
                </span>
              </>
            }
            hint="Use {query} as the placeholder. Overrides AI route detection. Leave empty for open-only routes."
          >
            <Input
              value={searchUrl}
              onChange={(e) => setSearchUrl(e.target.value)}
              placeholder="https://site.com/search?q={query}"
            />
          </Field>
        )}

        <Field
          label={
            <>
              Shortcut Prefix <span className="font-normal text-danger">*</span>
            </>
          }
          hint="Required. This is how the site is triggered from Navix."
        >
          <Input
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
            placeholder="e.g. nt"
            maxLength={8}
          />
        </Field>

        <Field
          label="Display Icon"
          hint="Use an emoji OR paste a logo image URL."
        >
          <div className="grid grid-cols-[4rem_minmax(0,1fr)] items-center gap-2">
            <Input
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              placeholder="📓"
              maxLength={2}
              className="w-full text-center"
            />
            <Input
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://…/logo.png"
              className="min-w-0 flex-1"
            />
          </div>
        </Field>

        <Toggle
          checked={addToQL}
          onChange={setAddToQL}
          label="Add to Quick Launch"
        />

        <PrimaryButton onClick={handleSave} disabled={saving} full>
          {saving ? "Saving…" : editSite ? "Save Changes" : "Add Site"}
        </PrimaryButton>

        {status.msg && (
          <p className={`m-0 text-center text-[0.78rem] ${statusColor}`}>
            {status.msg}
          </p>
        )}
      </div>
    </Modal>
  );
}

function Field({ label, hint, children }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="flex items-center gap-2 text-[0.83rem] font-semibold text-app">
        {label}
      </label>
      {children}
      {hint && (
        <p className="m-0 text-[0.72rem] leading-normal text-app-3">{hint}</p>
      )}
    </div>
  );
}
