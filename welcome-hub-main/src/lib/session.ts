export type UserRole = "student" | "teacher";

export type StoredUser = {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
};

const ROLE_KEY = "thg.role";
const USER_KEY = "thg.user";

export function getStoredRole(): UserRole | null {
  const v = localStorage.getItem(ROLE_KEY);
  if (v === "student" || v === "teacher") return v;
  return null;
}

export function setStoredRole(role: UserRole) {
  localStorage.setItem(ROLE_KEY, role);
}

export function clearStoredRole() {
  localStorage.removeItem(ROLE_KEY);
}

export function getStoredUser(): StoredUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredUser;
    if (!parsed || (parsed.role !== "student" && parsed.role !== "teacher")) return null;
    if (typeof parsed.id !== "string" || !parsed.id) return null;
    if (typeof parsed.email !== "string" || !parsed.email) return null;
    if (typeof parsed.displayName !== "string" || !parsed.displayName) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function setStoredUser(user: StoredUser) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredUser() {
  localStorage.removeItem(USER_KEY);
}
