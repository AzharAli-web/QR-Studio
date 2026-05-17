export const STORAGE_KEYS = {
  history: "qrstudio.history.v1",
};

export function safeJsonParse(str, fallback) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

export function loadHistory() {
  if (typeof window === "undefined") return [];
  const items = safeJsonParse(localStorage.getItem(STORAGE_KEYS.history) || "[]", []);
  return Array.isArray(items) ? items : [];
}

export function saveHistory(items) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(items));
}

