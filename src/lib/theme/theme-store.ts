export type Theme = "light" | "dark" | "system";
export const THEME_KEY = "theme";

const listeners = new Set<() => void>();
const media = () => window.matchMedia("(prefers-color-scheme: dark)");

function read(): Theme {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}

function apply(theme: Theme) {
  const root = document.documentElement;
  const dark = theme === "dark" || (theme === "system" && media().matches);
  root.classList.add("theme-switching"); // suspends transitions so nothing lags behind the swap
  root.classList.toggle("dark", dark);
  root.style.colorScheme = dark ? "dark" : "light";
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove("theme-switching")));
}

export function setTheme(theme: Theme) {
  try {
    if (theme === "system") localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, theme);
  } catch {}
  apply(theme);
  listeners.forEach((l) => l());
}

export function subscribe(onChange: () => void) {
  listeners.add(onChange);
  const mq = media();
  const onSystem = () => {
    if (read() === "system") apply("system");
    onChange();
  };
  const onStorage = (e: StorageEvent) => {
    if (e.key === THEME_KEY || e.key === null) {
      apply(read()); // another tab changed the theme
      onChange();
    }
  };
  mq.addEventListener("change", onSystem);
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    mq.removeEventListener("change", onSystem);
    window.removeEventListener("storage", onStorage);
  };
}

export const getSnapshot = read;
export const getServerSnapshot = (): Theme => "system";
