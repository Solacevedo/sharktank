const KEY = "board_display_name";

export function getDisplayName(): string | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(KEY);
  return v && v.trim() ? v.trim() : null;
}

export function setDisplayName(name: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, name.trim());
}

export function clearDisplayName() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}
