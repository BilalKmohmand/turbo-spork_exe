export const DASHBOARD_URL =
  import.meta.env.VITE_DASHBOARD_URL ||
  (import.meta.env.DEV ? "http://localhost:5050/dashboard" : "https://thehighgrader.app/dashboard");

const IS_DESKTOP =
  typeof window !== "undefined" &&
  typeof (window as any).thg !== "undefined" &&
  typeof (window as any).thg.platform === "string";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV || IS_DESKTOP ? "http://localhost:5050" : "https://thehighgrader.app");
