import QRCode from "qrcode";

export const QR_TYPES = ["auto", "text", "url", "email", "phone", "wifi"];

export function detectType(input) {
  const raw = String(input ?? "").trim();
  if (!raw) return "text";

  const lower = raw.toLowerCase();
  if (lower.startsWith("wifi:")) return "wifi";
  if (lower.startsWith("mailto:")) return "email";
  if (lower.startsWith("tel:")) return "phone";
  if (/^https?:\/\//i.test(raw)) return "url";
  if (raw.includes("@") && !raw.includes(" ")) return "email";
  if (/^\+?[0-9][0-9\s().-]{6,}$/.test(raw.replace(/ext\.?\s*\d+$/i, "").trim()))
    return "phone";
  if (/^www\./i.test(raw)) return "url";
  // Domain-like (e.g. example.com/path) without scheme
  if (
    /^[a-z0-9-]+(\.[a-z0-9-]+)+([/:?#].*)?$/i.test(raw) &&
    !raw.startsWith(".") &&
    !raw.endsWith(".")
  ) {
    return "url";
  }
  return "text";
}

export function buildWifiPayload({ ssid, password, encryption = "WPA", hidden = false }) {
  const s = String(ssid ?? "");
  const p = String(password ?? "");
  const t = String(encryption ?? "WPA").toUpperCase();
  const h = hidden ? "true" : "";


  const esc = (v) => String(v).replace(/([\\;,:"])/g, "\\$1");
  return `WIFI:T:${t};S:${esc(s)};P:${esc(p)};H:${h};;`;
}

export function buildEmailPayload({ email, subject = "", body = "" }) {
  const to = String(email ?? "").trim();
  const qs = new URLSearchParams();
  if (subject) qs.set("subject", subject);
  if (body) qs.set("body", body);
  const query = qs.toString();
  return `mailto:${to}${query ? `?${query}` : ""}`;
}

export function buildPhonePayload({ phone }) {
  const num = String(phone ?? "").trim();
  return `tel:${num}`;
}

export function normalizeUrl(url) {
  const raw = String(url ?? "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  if (/^www\./i.test(raw)) return `https://${raw}`;
  return raw;
}

export function buildPayload({ mode, rawInput, email, phone, wifi, url }) {
  const raw = String(rawInput ?? "").trim();

  if (mode === "auto") {
    const detected = detectType(raw);
    return buildPayload({
      mode: detected,
      rawInput: raw,
      email,
      phone,
      wifi,
      url,
    });
  }

  if (mode === "url") return normalizeUrl(url?.value ?? raw);
  if (mode === "email") return buildEmailPayload(email ?? { email: raw });
  if (mode === "phone") return buildPhonePayload(phone ?? { phone: raw });
  if (mode === "wifi") return buildWifiPayload(wifi ?? {});
  return raw;
}

export async function generateQrSvgString(payload, opts) {
  if (!payload) return "";
  return await QRCode.toString(payload, {
    type: "svg",
    width: opts.size,
    margin: 1,
    errorCorrectionLevel: opts.ecLevel,
    color: {
      dark: opts.fgColor,
      light: opts.bgColor,
    },
  });
}

export async function generateQrPngDataUrl(payload, opts) {
  if (!payload) return "";
  return await QRCode.toDataURL(payload, {
    width: opts.size,
    margin: 1,
    errorCorrectionLevel: opts.ecLevel,
    color: {
      dark: opts.fgColor,
      light: opts.bgColor,
    },
  });
}

export async function composePngWithLogo({ qrDataUrl, size, logoDataUrl }) {
  if (!qrDataUrl) return "";
  if (!logoDataUrl) return qrDataUrl;

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return qrDataUrl;

  const loadImage = (src) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });

  const [qrImg, logoImg] = await Promise.all([loadImage(qrDataUrl), loadImage(logoDataUrl)]);

  ctx.drawImage(qrImg, 0, 0, size, size);

  const logoSize = Math.round(size * 0.22);
  const pad = Math.round(logoSize * 0.18);
  const x = Math.round((size - logoSize) / 2);
  const y = Math.round((size - logoSize) / 2);

  const r = Math.round(logoSize * 0.18);
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + logoSize, y, x + logoSize, y + logoSize, r);
  ctx.arcTo(x + logoSize, y + logoSize, x, y + logoSize, r);
  ctx.arcTo(x, y + logoSize, x, y, r);
  ctx.arcTo(x, y, x + logoSize, y, r);
  ctx.closePath();
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + logoSize, y, x + logoSize, y + logoSize, r);
  ctx.arcTo(x + logoSize, y + logoSize, x, y + logoSize, r);
  ctx.arcTo(x, y + logoSize, x, y, r);
  ctx.arcTo(x, y, x + logoSize, y, r);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(logoImg, x + pad, y + pad, logoSize - pad * 2, logoSize - pad * 2);
  ctx.restore();

  return canvas.toDataURL("image/png");
}

