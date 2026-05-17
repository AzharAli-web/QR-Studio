"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Html5Qrcode } from "html5-qrcode";
import { useEffect, useMemo, useRef, useState } from "react";
import { detectType, normalizeUrl } from "../../lib/qr";
import { useToast } from "../toast/toast-provider";

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

const scannerMotion = {
  card: {
    initial: { opacity: 0, y: 12, filter: "blur(10px)" },
    animate: { opacity: 1, y: 0, filter: "blur(0px)" },
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  },
  modal: {
    initial: { opacity: 0, scale: 0.98, y: 10, filter: "blur(10px)" },
    animate: { opacity: 1, scale: 1, y: 0, filter: "blur(0px)" },
    exit: { opacity: 0, scale: 0.98, y: 12, filter: "blur(10px)" },
    transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
  },
};

function Button({ variant = "ghost", className = "", ...props }) {
  const base =
    "group relative inline-flex h-11 items-center justify-center gap-2 overflow-hidden rounded-2xl px-4 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/70 disabled:opacity-50 disabled:cursor-not-allowed";
  const styles =
    variant === "primary"
      ? "bg-zinc-950 text-white hover:bg-zinc-900 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
      : "bg-white/60 text-zinc-950 ring-1 ring-black/10 hover:bg-white dark:bg-white/10 dark:text-white dark:ring-white/15 dark:hover:bg-white/15";

  return (
    <motion.button
      whileTap={{ scale: 0.985 }}
      whileHover={{ y: -1, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 520, damping: 38 }}
      className={cx(base, styles, className)}
      {...props}
    >
      <span className="pointer-events-none absolute -inset-10 opacity-0 blur-2xl transition duration-500 group-hover:opacity-100">
        <span className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-fuchsia-500/10 to-cyan-400/18" />
      </span>
      <span className="relative z-10">{props.children}</span>
    </motion.button>
  );
}

function Pill({ children }) {
  return (
    <div className="inline-flex items-center rounded-full bg-black/5 px-3 py-1 text-[11px] font-semibold text-zinc-700 ring-1 ring-black/10 dark:bg-white/5 dark:text-zinc-200/80 dark:ring-white/10">
      {children}
    </div>
  );
}

function getVideoTrackFromContainer(container) {
  const video = container?.querySelector?.("video");
  const stream = video?.srcObject;
  return stream?.getVideoTracks?.()?.[0] || null;
}

function buildActions(result, { onCopy }) {
  if (!result?.text) return [];
  const type = result.type;
  const raw = result.text;
  if (type === "url") {
    const url = normalizeUrl(raw);
    return [
      {
        key: "open",
        label: "Open link",
        variant: "primary",
        onClick: () => window.open(url, "_blank", "noopener,noreferrer"),
      },
      { key: "copy", label: "Copy", variant: "ghost", onClick: () => onCopy(url) },
    ];
  }
  if (type === "email") {
    const href = raw.startsWith("mailto:") ? raw : `mailto:${raw}`;
    return [
      { key: "mail", label: "Email", variant: "primary", onClick: () => (window.location.href = href) },
      { key: "copy", label: "Copy", variant: "ghost", onClick: () => onCopy(raw) },
    ];
  }
  if (type === "phone") {
    const href = raw.startsWith("tel:") ? raw : `tel:${raw}`;
    return [
      { key: "call", label: "Call", variant: "primary", onClick: () => (window.location.href = href) },
      { key: "copy", label: "Copy", variant: "ghost", onClick: () => onCopy(raw) },
    ];
  }
  return [{ key: "copy", label: "Copy text", variant: "primary", onClick: () => onCopy(raw) }];
}

export default function ScannerClient() {
  const toast = useToast();
  const regionId = useMemo(() => `qr-region-${Math.random().toString(16).slice(2)}`, []);
  const regionRef = useRef(null);
  const qrRef = useRef(null);
  const startingRef = useRef(false);

  const [hasStarted, setHasStarted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [status, setStatus] = useState({ kind: "idle", message: "" }); // idle | info | error

  const [cameras, setCameras] = useState([]);
  const [cameraId, setCameraId] = useState("");

  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  const [dragHover, setDragHover] = useState(false);
  const [result, setResult] = useState(null); // { text, type }
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    return () => {
      (async () => {
        try {
          const inst = qrRef.current;
          if (inst?.isScanning) await inst.stop();
          await inst?.clear?.();
        } catch {}
      })();
    };
  }, []);

  async function ensureInstance() {
    if (!qrRef.current) qrRef.current = new Html5Qrcode(regionId, false);
    return qrRef.current;
  }

  async function loadCameras() {
    try {
      setIsBusy(true);
      const list = await Html5Qrcode.getCameras();
      setCameras(list || []);
      if (!cameraId && list?.[0]?.id) setCameraId(list[0].id);
      return list || [];
    } catch {
      setStatus({
        kind: "error",
        message: "Camera access is blocked. Allow permissions, then retry.",
      });
      toast.show({ variant: "error", title: "Camera blocked", message: "Allow camera permissions, then retry." });
      return [];
    } finally {
      setIsBusy(false);
    }
  }

  async function start() {
    if (startingRef.current) return;
    startingRef.current = true;
    setIsBusy(true);
    setStatus({ kind: "info", message: "Requesting camera…" });

    try {
      const list = cameras.length ? cameras : await loadCameras();
      const cam = cameraId || list?.[0]?.id;
      if (!cam) {
        setStatus({ kind: "error", message: "No camera found on this device." });
        return;
      }

      const qr = await ensureInstance();
      if (qr.isScanning) {
        setHasStarted(true);
        setStatus({ kind: "idle", message: "" });
        return;
      }

      const box = Math.round(clamp((window.innerWidth || 900) * 0.55, 240, 420));

      await qr.start(
        { deviceId: { exact: cam } },
        { fps: 12, qrbox: { width: box, height: box }, aspectRatio: 1.0 },
        (decodedText) => {
          const text = String(decodedText || "").trim();
          if (!text) return;
          setResult({ text, type: detectType(text) });
          setStatus({ kind: "idle", message: "" });
        },
        () => {},
      );

      setHasStarted(true);
      setStatus({ kind: "idle", message: "" });

      setTimeout(() => {
        try {
          const track = getVideoTrackFromContainer(regionRef.current);
          const caps = track?.getCapabilities?.();
          setTorchSupported(Boolean(caps?.torch));
        } catch {
          setTorchSupported(false);
        }
      }, 350);
    } catch {
      setHasStarted(false);
      setStatus({
        kind: "error",
        message: "Couldn’t start the camera. Enable permission and try again.",
      });
      toast.show({ variant: "error", title: "Camera failed", message: "Couldn’t start the camera on this device." });
    } finally {
      startingRef.current = false;
      setIsBusy(false);
    }
  }

  async function stop() {
    try {
      const qr = qrRef.current;
      if (qr?.isScanning) await qr.stop();
      await qr?.clear?.();
    } catch {}
    setHasStarted(false);
    setTorchOn(false);
    setTorchSupported(false);
  }

  async function switchCamera() {
    const list = cameras.length ? cameras : await loadCameras();
    if (list.length < 2) return;
    const idx = list.findIndex((c) => c.id === cameraId);
    const next = list[(idx + 1) % list.length];
    setCameraId(next.id);
    if (hasStarted) {
      await stop();
      await new Promise((r) => setTimeout(r, 80));
      await start();
    }
  }

  async function toggleTorch() {
    try {
      const track = getVideoTrackFromContainer(regionRef.current);
      if (!track) return;
      const caps = track.getCapabilities?.();
      if (!caps?.torch) {
        setTorchSupported(false);
        return;
      }
      const next = !torchOn;
      await track.applyConstraints?.({ advanced: [{ torch: next }] });
      setTorchOn(next);
      setTorchSupported(true);
    } catch {
      setStatus({ kind: "error", message: "Flash isn’t available on this device." });
      toast.show({ variant: "error", title: "Flash unavailable", message: "Torch control isn’t supported here." });
      setTorchSupported(false);
      setTorchOn(false);
    }
  }

  async function scanFile(file) {
    if (!file) return;
    setIsBusy(true);
    setStatus({ kind: "info", message: "Scanning image…" });
    try {
      const qr = await ensureInstance();
      const decodedText = await qr.scanFile(file, true);
      const text = String(decodedText || "").trim();
      if (!text) {
        setStatus({ kind: "error", message: "No QR found in that image." });
        toast.show({ variant: "error", title: "No QR found", message: "Try a clearer image." });
        return;
      }
      setResult({ text, type: detectType(text) });
      setStatus({ kind: "idle", message: "" });
      toast.show({ variant: "success", title: "Scanned", message: "QR detected from image." });
    } catch {
      setStatus({ kind: "error", message: "Couldn’t read a QR from that image." });
      toast.show({ variant: "error", title: "Scan failed", message: "Couldn’t read a QR from that image." });
    } finally {
      setIsBusy(false);
    }
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      toast.show({ variant: "success", title: "Copied", message: "Saved to clipboard." });
    } catch {
      toast.show({ variant: "error", title: "Clipboard blocked", message: "Your browser blocked clipboard access." });
    }
  }

  const actions = useMemo(() => buildActions(result, { onCopy: copyText }), [result]);

  return (
    <div className={cx(isFullscreen && "fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm")}>
      <motion.section
        {...scannerMotion.card}
        className={cx(
          "relative mx-auto w-full max-w-6xl",
          isFullscreen ? "h-full p-3 sm:p-6" : "py-10 sm:py-16",
        )}
      >
        <div
          className={cx(
            "rounded-3xl bg-white/60 ring-1 ring-black/5 backdrop-blur-xl dark:bg-black/30 dark:ring-white/10",
            isFullscreen ? "h-full p-4 sm:p-6" : "p-6 sm:p-10",
          )}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-balance text-4xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-5xl">
                Scanner
              </h1>
              <p className="mt-2 max-w-2xl text-pretty text-sm leading-6 text-zinc-700 dark:text-zinc-200/85 sm:text-base">
                Camera scanning + image scanning with smart actions and premium motion UI.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" onClick={loadCameras}>
                Refresh cameras
              </Button>
              <Button
                variant="ghost"
                onClick={() => setIsFullscreen((v) => !v)}
                className="whitespace-nowrap"
              >
                {isFullscreen ? "Exit fullscreen" : "Fullscreen"}
              </Button>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Pill>Camera: {cameras.length ? `${cameras.length} found` : "not loaded"}</Pill>
            <Pill>{hasStarted ? "Live scanning" : "Stopped"}</Pill>
            <Pill>Torch: {torchSupported ? (torchOn ? "On" : "Off") : "Unavailable"}</Pill>
          </div>

          {status.message ? (
            <div
              className={cx(
                "mt-4 rounded-2xl px-4 py-3 text-sm ring-1",
                status.kind === "error"
                  ? "bg-rose-500/10 text-rose-700 ring-rose-500/20 dark:text-rose-200"
                  : "bg-indigo-500/10 text-indigo-700 ring-indigo-500/20 dark:text-indigo-200",
              )}
            >
              {status.message}
            </div>
          ) : null}

          <div className={cx("mt-6 grid gap-6", isFullscreen ? "lg:grid-cols-[1fr_420px] h-[calc(100%-180px)]" : "lg:grid-cols-[1fr_420px]")}>
            <div className="relative">
              <div
                onDragEnter={(e) => {
                  e.preventDefault();
                  setDragHover(true);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragHover(true);
                }}
                onDragLeave={() => setDragHover(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragHover(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) scanFile(file);
                }}
                className={cx(
                  "relative overflow-hidden rounded-3xl ring-1",
                  "bg-black/5 ring-black/10 dark:bg-white/5 dark:ring-white/10",
                  isFullscreen ? "h-full min-h-[420px]" : "min-h-[420px]",
                )}
              >
                <div className="absolute inset-0">
                  <div
                    className={cx(
                      "absolute inset-0 transition",
                      dragHover && "bg-indigo-500/10",
                    )}
                  />
                </div>

                <div className="absolute inset-0 grid place-items-center">
                  <div className="relative w-[84%] max-w-[520px] aspect-square">
                    <motion.div
                      animate={{ opacity: hasStarted ? 1 : 0.65, scale: hasStarted ? 1 : 0.985 }}
                      transition={{ duration: 0.25 }}
                      className="absolute inset-0 rounded-[36px] ring-1 ring-white/25"
                      style={{
                        background:
                          "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
                      }}
                    />
                    <motion.div
                      animate={{ boxShadow: hasStarted ? "0 0 0 1px rgba(255,255,255,0.28), 0 18px 60px rgba(2,6,23,0.25)" : "0 0 0 1px rgba(255,255,255,0.15)" }}
                      transition={{ duration: 0.35 }}
                      className="absolute inset-0 rounded-[36px]"
                    />
                    <motion.div
                      aria-hidden="true"
                      className="absolute inset-0 rounded-[36px]"
                      initial={false}
                      animate={
                        hasStarted
                          ? {
                              boxShadow: [
                                "0 0 0 1px rgba(255,255,255,0.20)",
                                "0 0 0 1px rgba(255,255,255,0.35), 0 0 28px rgba(99,102,241,0.20)",
                                "0 0 0 1px rgba(255,255,255,0.20)",
                              ],
                            }
                          : { boxShadow: "0 0 0 1px rgba(255,255,255,0.14)" }
                      }
                      transition={{ duration: 1.6, repeat: hasStarted ? Infinity : 0, ease: "easeInOut" }}
                    />
                    {hasStarted ? <div className="scanner-laser" /> : null}
                  </div>
                </div>

                <div ref={regionRef} className="absolute inset-0">
                  <div id={regionId} className="h-full w-full" />
                </div>

                {!hasStarted ? (
                  <div className="absolute inset-0 grid place-items-center p-6">
                    <div className="max-w-sm text-center">
                      <div className="text-sm font-semibold text-zinc-950 dark:text-white">
                        Camera permission required
                      </div>
                      <div className="mt-2 text-xs leading-6 text-zinc-600 dark:text-zinc-300/75">
                        Click “Start camera” to grant access. You can also drag & drop a QR image here.
                      </div>
                      <div className="mt-4 flex flex-col gap-2">
                        <Button variant="primary" onClick={start} disabled={isBusy}>
                          Start camera
                        </Button>
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => scanFile(e.target.files?.[0])}
                          />
                          <div className="h-11 rounded-2xl bg-white/70 px-4 text-sm font-semibold leading-[44px] text-zinc-950 ring-1 ring-black/10 transition hover:bg-white dark:bg-white/10 dark:text-white dark:ring-white/15 dark:hover:bg-white/15">
                            {isBusy ? "Working…" : "Scan image"}
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              {hasStarted ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button variant="primary" onClick={stop} disabled={isBusy}>
                    Stop
                  </Button>
                  <Button onClick={switchCamera} disabled={isBusy || cameras.length < 2}>
                    Switch camera
                  </Button>
                  <Button onClick={toggleTorch} disabled={isBusy || !torchSupported}>
                    {torchOn ? "Flash off" : "Flash on"}
                  </Button>
                  <label className="flex-1 cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => scanFile(e.target.files?.[0])}
                    />
                    <div className="h-11 w-full rounded-2xl bg-white/60 px-4 text-sm font-semibold leading-[44px] text-zinc-950 ring-1 ring-black/10 transition hover:bg-white dark:bg-white/10 dark:text-white dark:ring-white/15 dark:hover:bg-white/15">
                      Scan image
                    </div>
                  </label>
                </div>
              ) : null}
            </div>

            <div className={cx(isFullscreen ? "h-full" : "")}>
              <div className="rounded-3xl bg-white/60 p-5 ring-1 ring-black/5 backdrop-blur-xl dark:bg-black/30 dark:ring-white/10">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-zinc-950 dark:text-white">Result</div>
                  <Button onClick={() => setResult(null)} disabled={!result}>
                    Clear
                  </Button>
                </div>

                <div className="mt-3 rounded-2xl bg-white/70 p-4 text-xs text-zinc-800 ring-1 ring-black/5 dark:bg-black/20 dark:text-zinc-100 dark:ring-white/10">
                  {result?.text ? (
                    <div className="break-all">{result.text}</div>
                  ) : (
                    <div className="text-zinc-500">
                      Scan a QR code to see a smart action here.
                    </div>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {actions.map((a) => (
                    <Button key={a.key} variant={a.variant} onClick={a.onClick}>
                      {a.label}
                    </Button>
                  ))}
                </div>

                <div className="mt-6 text-xs text-zinc-600 dark:text-zinc-300/70">
                  Tip: Try QR types like URL, Email, Phone, or plain text. Drag & drop images directly onto the preview.
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      <AnimatePresence>
        {result?.text ? (
          <motion.div
            className="fixed inset-0 z-[70] grid place-items-end p-4 sm:place-items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/30"
              onClick={() => setResult(null)}
            />
            <motion.div
              {...scannerMotion.modal}
              className="relative w-full max-w-lg rounded-3xl bg-white/80 p-5 ring-1 ring-black/10 backdrop-blur-xl dark:bg-black/60 dark:ring-white/15"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-zinc-950 dark:text-white">
                    QR detected
                  </div>
                  <div className="mt-1 text-[11px] text-zinc-600 dark:text-zinc-300/70">
                    Type: <span className="font-semibold">{String(result.type).toUpperCase()}</span>
                  </div>
                </div>
                <Button onClick={() => setResult(null)}>Close</Button>
              </div>
              <div className="mt-3 rounded-2xl bg-white/70 p-4 text-xs text-zinc-800 ring-1 ring-black/5 dark:bg-black/20 dark:text-zinc-100 dark:ring-white/10">
                <div className="break-all">{result.text}</div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {actions.map((a) => (
                  <Button key={a.key} variant={a.variant} onClick={a.onClick}>
                    {a.label}
                  </Button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

