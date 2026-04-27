import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import SplashScreen from "@/components/SplashScreen";
import RoleSelection from "@/components/RoleSelection";
import AuthForm from "@/components/AuthForm";
import { getStoredRole, getStoredUser, setStoredRole, setStoredUser, type StoredUser, type UserRole } from "@/lib/session";
import { apiFetch } from "@/lib/api";

type AppState = "splash" | "role" | "auth";

const Index = () => {
  const navigate = useNavigate();
  const [state, setState] = useState<AppState>("splash");
  const [role, setRole] = useState<UserRole | null>(() => getStoredRole());

  useEffect(() => {
    const localUser = getStoredUser();
    if (localUser) {
      navigate("/dashboard");
      return;
    }

    apiFetch<{ user: StoredUser }>("/api/auth/me")
      .then((data) => {
        setStoredUser(data.user);
        navigate("/dashboard");
      })
      .catch(() => {
        // Not authenticated
      });
  }, [navigate]);

  const handleSplashComplete = useCallback(() => setState("role"), []);

  const handleRoleSelect = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setStoredRole(selectedRole);
    setState("auth");
  };

  return (
    <div className="min-h-screen bg-background bg-grid-pattern flex items-center justify-center relative overflow-hidden">
      {/* Ambient glow */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[150px] pointer-events-none" />

      {state === "splash" && <SplashScreen onComplete={handleSplashComplete} />}

      {state === "role" && <RoleSelection onSelect={handleRoleSelect} />}

      {state === "auth" && role && (
        <AuthForm role={role} onBack={() => setState("role")} onAuthed={() => navigate("/dashboard")} />
      )}
    </div>
  );
};

export default Index;
