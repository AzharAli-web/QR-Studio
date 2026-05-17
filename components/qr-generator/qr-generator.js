"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  QR_TYPES,
  buildPayload,
  composePngWithLogo,
  detectType,
  generateQrPngDataUrl,
  generateQrSvgString,
} from "../../lib/qr";
import { Button, Card, Field, Input, Select, Textarea } from "./ui";
import { motionPreset } from "./motion";
import { STORAGE_KEYS, loadHistory, saveHistory } from "../../lib/storage";
import { useToast } from "../toast/toast-provider";

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadDataUrl(filename, dataUrl) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

export default function QrGenerator() {
  const toast = useToast();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState("auto");

  const [rawInput, setRawInput] = useState("");
  const [urlValue, setUrlValue] = useState("");
  const [email, setEmail] = useState({ email: "", subject: "", body: "" });
  const [phone, setPhone] = useState({ phone: "" });
  const [wifi, setWifi] = useState({
    ssid: "",
    password: "",
    encryption: "WPA",
    hidden: false,
  });

  const [fgColor, setFgColor] = useState("#111827");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [size, setSize] = useState(320);
  const [ecLevel, setEcLevel] = useState("M");

  const [logoDataUrl, setLogoDataUrl] = useState("");
  const [logoName, setLogoName] = useState("");

  const [history, setHistory] = useState([]);

  const [svg, setSvg] = useState("");
  const [png, setPng] = useState("");
  const [status, setStatus] = useState({ state: "idle", message: "" });

  const lastGenKeyRef = useRef("");

  useEffect(() => {
    const items = loadHistory();
    setHistory(items.slice(0, 30));
  }, []);

  useEffect(() => {
    saveHistory(history.slice(0, 30));
  }, [history]);

  useEffect(() => {
    const fromUrl = searchParams?.get("data");
    if (!fromUrl) return;
    const decoded = (() => {
      try {
        return decodeURIComponent(fromUrl);
      } catch {
        return fromUrl;
      }
    })();
    setMode("text");
    setRawInput(decoded);
    toast.show({ variant: "success", title: "Loaded", message: "Imported data into the generator." });

  }, []);

  const detectedType = useMemo(() => detectType(rawInput), [rawInput]);
  const effectiveType = mode === "auto" ? detectedType : mode;

  const detectedUi = useMemo(() => {
    const t = detectedType;
    const icon =
      t === "url"
        ? "🔗"
        : t === "email"
          ? "✉️"
          : t === "phone"
            ? "📞"
            : t === "wifi"
              ? "📶"
              : "📝";
    const label =
      t === "url" ? "URL" : t === "email" ? "Email" : t === "phone" ? "Phone" : t === "wifi" ? "WiFi" : "Text";
    return { icon, label };
  }, [detectedType]);

  const payload = useMemo(() => {
    const value = buildPayload({
      mode,
      rawInput,
      url: { value: urlValue },
      email,
      phone,
      wifi,
    });
    return String(value ?? "").trim();
  }, [mode, rawInput, urlValue, email, phone, wifi]);

  const opts = useMemo(
    () => ({
      fgColor,
      bgColor,
      size: clamp(Number(size) || 320, 160, 720),
      ecLevel,
    }),
    [fgColor, bgColor, size, ecLevel],
  );

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const genKey = JSON.stringify({
        payload,
        opts,
        hasLogo: Boolean(logoDataUrl),
      });
      if (!payload) {
        setSvg("");
        setPng("");
        setStatus({ state: "idle", message: "" });
        return;
      }
      if (genKey === lastGenKeyRef.current) return;
      lastGenKeyRef.current = genKey;

      setStatus({ state: "loading", message: "Generating…" });
      try {
        const [svgStr, pngUrl] = await Promise.all([
          generateQrSvgString(payload, opts),
          generateQrPngDataUrl(payload, opts),
        ]);
        if (cancelled) return;

        const composed = await composePngWithLogo({
          qrDataUrl: pngUrl,
          size: opts.size,
          logoDataUrl,
        });
        if (cancelled) return;

        setSvg(svgStr);
        setPng(composed);
        setStatus({ state: "ready", message: "" });
      } catch (e) {
        if (cancelled) return;
        setStatus({ state: "error", message: "Couldn’t generate QR. Try simpler input." });
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [payload, opts, logoDataUrl]);

  function pushHistory() {
    if (!payload) return;
    const item = {
      id: crypto.randomUUID(),
      ts: Date.now(),
      type: effectiveType,
      payload,
      opts,
    };
    setHistory((prev) => [item, ...prev.filter((x) => x.payload !== payload)].slice(0, 30));
    toast.show({ variant: "success", title: "Saved", message: "Added to your local history." });
  }

  async function copyPayload() {
    if (!payload) return;
    try {
      await navigator.clipboard.writeText(payload);
      toast.show({ variant: "success", title: "Copied", message: "Encoded data copied." });
    } catch {
      toast.show({ variant: "error", title: "Clipboard blocked", message: "Your browser blocked clipboard access." });
    }
  }

  function onLogoFile(file) {
    if (!file) return;
    setLogoName(file.name || "logo");
    const reader = new FileReader();
    reader.onload = () => setLogoDataUrl(String(reader.result || ""));
    reader.readAsDataURL(file);
  }

  async function downloadSvg() {
    if (!svg) return;
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    downloadBlob(`qr-studio-${Date.now()}.svg`, blob);
    toast.show({ variant: "success", title: "Downloaded", message: "Saved SVG to your device." });
  }

  function downloadPng() {
    if (!png) return;
    downloadDataUrl(`qr-studio-${Date.now()}.png`, png);
    toast.show({ variant: "success", title: "Downloaded", message: "Saved PNG to your device." });
  }

  function applyHistory(item) {
    setMode("text");
    setRawInput(item.payload);
    setFgColor(item.opts?.fgColor || "#111827");
    setBgColor(item.opts?.bgColor || "#ffffff");
    setSize(item.opts?.size || 320);
    setEcLevel(item.opts?.ecLevel || "M");
    setLogoDataUrl("");
    setLogoName("");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-balance text-4xl font-semibold tracking-tight text-white/80 dark:text-white sm:text-5xl">
            QR Generator
          </h1>
          <p className="mt-2 max-w-2xl text-pretty text-sm leading-6 text-white/50 dark:text-zinc-200/85 sm:text-base">
            Premium, real-time QR creation with styling, logo overlay, downloads, and local history.
          </p>
        </div>
        <motion.div {...motionPreset.fadeIn} className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={copyPayload} disabled={!payload}>
            Copy data
          </Button>
          <Button variant="ghost" onClick={pushHistory} disabled={!payload}>
            Save to history
          </Button>
        </motion.div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <motion.div {...motionPreset.card} className="space-y-6">
          <Card className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <div className="text-sm font-semibold text-zinc-950 dark:text-white">Input</div>
                <div className="text-xs text-zinc-600 dark:text-zinc-300/70">
                  {mode === "auto" ? (
                    <span className="inline-flex items-center gap-2">
                      Detected:
                      <span className="inline-flex items-center gap-1 rounded-full bg-black/5 px-2.5 py-1 text-[11px] font-semibold text-zinc-800 ring-1 ring-black/10 dark:bg-white/5 dark:text-zinc-100 dark:ring-white/10">
                        <span aria-hidden="true">{detectedUi.icon}</span>
                        {detectedUi.label}
                      </span>
                    </span>
                  ) : (
                    <span>
                      Mode: <span className="font-semibold">{effectiveType.toUpperCase()}</span>
                    </span>
                  )}
                </div>
              </div>
              <div className="w-full sm:w-56">
                <Select value={mode} onChange={(e) => setMode(e.target.value)}>
                  {QR_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t === "auto" ? "Auto detect" : t.toUpperCase()}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="mt-5 grid gap-4">
              <AnimatePresence mode="popLayout" initial={false}>
                {effectiveType === "wifi" ? (
                  <motion.div
                    key="wifi"
                    initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -8, filter: "blur(8px)" }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className="grid gap-4"
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="WiFi name (SSID)">
                        <Input
                          value={wifi.ssid}
                          onChange={(e) => setWifi((w) => ({ ...w, ssid: e.target.value }))}
                          placeholder="e.g. Office-5G"
                        />
                      </Field>
                      <Field label="Password">
                        <Input
                          value={wifi.password}
                          onChange={(e) => setWifi((w) => ({ ...w, password: e.target.value }))}
                          placeholder="••••••••"
                        />
                      </Field>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Encryption">
                        <Select
                          value={wifi.encryption}
                          onChange={(e) => setWifi((w) => ({ ...w, encryption: e.target.value }))}
                        >
                          <option value="WPA">WPA/WPA2</option>
                          <option value="WEP">WEP</option>
                          <option value="nopass">No password</option>
                        </Select>
                      </Field>
                      <Field label="Hidden network">
                        <label className="flex h-11 items-center justify-between rounded-2xl bg-white/70 px-3 text-sm ring-1 ring-black/10 dark:bg-white/5 dark:ring-white/10">
                          <span className="text-zinc-700 dark:text-zinc-200/80">Hidden</span>
                          <motion.input
                            whileTap={{ scale: 0.98 }}
                            type="checkbox"
                            checked={wifi.hidden}
                            onChange={(e) => setWifi((w) => ({ ...w, hidden: e.target.checked }))}
                            className="h-4 w-4 accent-indigo-500"
                          />
                        </label>
                      </Field>
                    </div>
                  </motion.div>
                ) : effectiveType === "email" ? (
                  <motion.div
                    key="email"
                    initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -8, filter: "blur(8px)" }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className="grid gap-4"
                  >
                    <Field label="Email address">
                      <Input
                        value={email.email}
                        onChange={(e) => setEmail((x) => ({ ...x, email: e.target.value }))}
                        placeholder="you@company.com"
                      />
                    </Field>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Subject (optional)">
                        <Input
                          value={email.subject}
                          onChange={(e) => setEmail((x) => ({ ...x, subject: e.target.value }))}
                          placeholder="Hello"
                        />
                      </Field>
                      <Field label="Body (optional)">
                        <Input
                          value={email.body}
                          onChange={(e) => setEmail((x) => ({ ...x, body: e.target.value }))}
                          placeholder="Message…"
                        />
                      </Field>
                    </div>
                  </motion.div>
                ) : effectiveType === "phone" ? (
                  <motion.div
                    key="phone"
                    initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -8, filter: "blur(8px)" }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className="grid gap-4"
                  >
                    <Field label="Phone number">
                      <Input
                        value={phone.phone}
                        onChange={(e) => setPhone({ phone: e.target.value })}
                        placeholder="+1 555 123 4567"
                      />
                    </Field>
                  </motion.div>
                ) : effectiveType === "url" ? (
                  <motion.div
                    key="url"
                    initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -8, filter: "blur(8px)" }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className="grid gap-4"
                  >
                    <Field label="URL">
                      <Input
                        value={urlValue}
                        onChange={(e) => setUrlValue(e.target.value)}
                        placeholder="https://yourdomain.com"
                      />
                    </Field>
                  </motion.div>
                ) : (
                  <motion.div
                    key="text"
                    initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -8, filter: "blur(8px)" }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className="grid gap-4"
                  >
                    <Field label={effectiveType === "auto" ? "Text" : effectiveType.toUpperCase()}>
                      <Textarea
                        value={rawInput}
                        onChange={(e) => setRawInput(e.target.value)}
                        placeholder="Paste text, a URL, an email, a phone number, or WIFI:…"
                      />
                    </Field>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="mt-5 rounded-2xl bg-black/[0.03] p-3 ring-1 ring-black/5 dark:bg-white/[0.04] dark:ring-white/10">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200/90">
                  Encoded data
                </div>
                <div className="text-[11px] text-zinc-600 dark:text-zinc-300/70">
                  Type: <span className="font-semibold">{effectiveType.toUpperCase()}</span>
                </div>
              </div>
              <div className="mt-2 break-all rounded-xl bg-white/70 p-3 text-xs text-zinc-800 ring-1 ring-black/5 dark:bg-black/20 dark:text-zinc-100 dark:ring-white/10">
                {payload || <span className="text-zinc-500">Start typing to generate…</span>}
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-zinc-950 dark:text-white">
                  Customize
                </div>
                <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-300/70">
                  Style your QR (colors, size, error correction).
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="QR color">
                <div className="flex h-11 items-center gap-3 rounded-2xl bg-white/70 px-3 ring-1 ring-black/10 dark:bg-white/5 dark:ring-white/10">
                  <input
                    type="color"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="h-7 w-9 cursor-pointer rounded"
                  />
                  <Input
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="h-9 bg-transparent ring-0 focus:ring-0"
                  />
                </div>
              </Field>
              <Field label="Background color">
                <div className="flex h-11 items-center gap-3 rounded-2xl bg-white/70 px-3 ring-1 ring-black/10 dark:bg-white/5 dark:ring-white/10">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="h-7 w-9 cursor-pointer rounded"
                  />
                  <Input
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="h-9 bg-transparent ring-0 focus:ring-0"
                  />
                </div>
              </Field>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Size" hint={`${opts.size}px`}>
                <div className="h-11 rounded-2xl bg-white/70 px-3 ring-1 ring-black/10 dark:bg-white/5 dark:ring-white/10">
                  <input
                    type="range"
                    min={160}
                    max={720}
                    step={10}
                    value={opts.size}
                    onChange={(e) => setSize(e.target.value)}
                    className="h-11 w-full accent-indigo-500"
                  />
                </div>
              </Field>
              <Field label="Error correction">
                <Select value={ecLevel} onChange={(e) => setEcLevel(e.target.value)}>
                  <option value="L">L (7%)</option>
                  <option value="M">M (15%)</option>
                  <option value="Q">Q (25%)</option>
                  <option value="H">H (30%)</option>
                </Select>
              </Field>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Center logo" hint={logoName ? `Loaded: ${logoName}` : "Optional"}>
                <div className="flex items-center gap-2">
                  <label className="flex-1 cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => onLogoFile(e.target.files?.[0])}
                    />
                    <div className="h-11 w-full rounded-2xl bg-white/70 px-3 text-sm leading-[44px] text-zinc-700 ring-1 ring-black/10 transition hover:bg-white dark:bg-white/5 dark:text-zinc-200/80 dark:ring-white/10 dark:hover:bg-white/10">
                      Upload logo
                    </div>
                  </label>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setLogoDataUrl("");
                      setLogoName("");
                    }}
                    disabled={!logoDataUrl}
                    className="whitespace-nowrap"
                  >
                    Remove
                  </Button>
                </div>
              </Field>
              <Field label="Downloads">
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={downloadPng} disabled={!png} className="flex-1">
                    PNG
                  </Button>
                  <Button variant="ghost" onClick={downloadSvg} disabled={!svg} className="flex-1">
                    SVG
                  </Button>
                </div>
              </Field>
            </div>
          </Card>
        </motion.div>

        <motion.div {...motionPreset.card} className="space-y-6">
          <Card className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-zinc-950 dark:text-white">
                  Live preview
                </div>
                <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-300/70">
                  Updates instantly as you type.
                </div>
              </div>
              {status.message ? (
                <div
                  className={[
                    "rounded-full px-3 py-1 text-[11px] font-semibold",
                    status.state === "error"
                      ? "bg-rose-500/15 text-rose-700 ring-1 ring-rose-500/20 dark:text-rose-200"
                      : "bg-indigo-500/15 text-indigo-700 ring-1 ring-indigo-500/20 dark:text-indigo-200",
                  ].join(" ")}
                >
                  {status.message}
                </div>
              ) : null}
            </div>

            <div className="mt-5 grid place-items-center">
              <AnimatePresence mode="wait" initial={false}>
                {png ? (
                  <motion.div
                    key={payload + fgColor + bgColor + size + ecLevel + Boolean(logoDataUrl)}
                    initial={{ opacity: 0, scale: 0.96, filter: "blur(10px)" }}
                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, scale: 0.98, filter: "blur(10px)" }}
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    className="relative"
                  >
                    <div
                      className="group relative overflow-hidden rounded-3xl bg-white/80 p-4 ring-1 ring-black/5 shadow-sm shadow-black/5 dark:bg-black/20 dark:ring-white/10"
                      style={{ width: opts.size + 32 }}
                    >
                      <div className="pointer-events-none absolute -inset-12 opacity-0 blur-2xl transition duration-500 group-hover:opacity-100">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/18 via-fuchsia-500/10 to-cyan-400/14" />
                      </div>
                      <img
                        src={png}
                        alt="QR preview"
                        className="h-auto w-full rounded-2xl"
                        style={{ imageRendering: "pixelated" }}
                      />
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="grid h-[360px] w-full place-items-center rounded-3xl bg-white/40 ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/10"
                  >
                    <div className="text-center">
                      <div className="text-sm font-semibold text-zinc-950 dark:text-white">
                        Ready when you are
                      </div>
                      <div className="mt-2 text-xs text-zinc-600 dark:text-zinc-300/70">
                        Enter data on the left to generate a QR code.
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button onClick={downloadPng} disabled={!png} className="flex-1">
                Download PNG
              </Button>
              <Button variant="ghost" onClick={downloadSvg} disabled={!svg} className="flex-1">
                Download SVG
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-zinc-950 dark:text-white">History</div>
                <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-300/70">
                  Stored locally (last 30).
                </div>
              </div>
              <Button
                variant="ghost"
                onClick={() => setHistory([])}
                disabled={history.length === 0}
              >
                Clear
              </Button>
            </div>

            <div className="mt-4 space-y-2">
              {history.length === 0 ? (
                <div className="rounded-2xl bg-white/60 p-4 text-xs text-zinc-600 ring-1 ring-black/5 dark:bg-white/5 dark:text-zinc-300/70 dark:ring-white/10">
                  Nothing saved yet. Click “Save to history” to store this QR locally.
                </div>
              ) : (
                history.map((item) => (
                  <motion.button
                    key={item.id}
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => applyHistory(item)}
                    className="w-full rounded-2xl bg-white/70 p-4 text-left ring-1 ring-black/5 transition hover:bg-white dark:bg-white/5 dark:ring-white/10 dark:hover:bg-white/10"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="truncate text-xs font-semibold text-zinc-950 dark:text-white">
                        {String(item.type || "text").toUpperCase()}
                      </div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        {new Date(item.ts).toLocaleString()}
                      </div>
                    </div>
                    <div className="mt-2 line-clamp-2 break-all text-xs text-zinc-700 dark:text-zinc-200/80">
                      {item.payload}
                    </div>
                  </motion.button>
                ))
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

