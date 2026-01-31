import { useState, useEffect } from "react";
import { useLocation } from "wouter";

export interface User {
  id: number;
  email: string;
  displayName: string;
  role: "student" | "teacher";
}

export function useAuth(requireAuth = false) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, navigate] = useLocation();

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem("user");
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading && requireAuth && !user) {
      navigate("/auth");
    }
  }, [isLoading, requireAuth, user, navigate]);

  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
    navigate("/");
  };

  return { user, isLoading, isAuthenticated: !!user, logout };
}
