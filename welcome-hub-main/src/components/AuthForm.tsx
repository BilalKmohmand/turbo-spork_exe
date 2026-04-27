import { useState } from "react";
import { ArrowLeft, Eye, EyeOff, GraduationCap, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { setStoredUser, type StoredUser, type UserRole } from "@/lib/session";
import { apiFetch } from "@/lib/api";

interface AuthFormProps {
  role: UserRole;
  onBack: () => void;
  onAuthed: () => void;
}

const AuthForm = ({ role, onBack, onAuthed }: AuthFormProps) => {
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const RoleIcon = role === "student" ? GraduationCap : BookOpen;
  const roleLabel = role === "student" ? "Student" : "Teacher";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError(null);
    setIsSubmitting(true);
    try {
      const data =
        mode === "signup"
          ? await apiFetch<{ user: StoredUser }>("/api/auth/register", {
              method: "POST",
              body: JSON.stringify({
                email: formData.email,
                password: formData.password,
                displayName: formData.name,
                role,
              }),
            })
          : await apiFetch<{ user: StoredUser }>("/api/auth/login", {
              method: "POST",
              body: JSON.stringify({
                email: formData.email,
                password: formData.password,
              }),
            });

      setStoredUser(data.user);
      onAuthed();
    } catch (e: any) {
      setError(e?.message || "Authentication failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md animate-fade-in">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">Back</span>
      </button>

      <div className="rounded-2xl border border-border bg-card p-8">
        {/* Role badge */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <RoleIcon className="w-4 h-4 text-primary" />
          </div>
          <span className="text-sm font-medium text-primary">{roleLabel}</span>
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl bg-muted p-1 mb-8">
          <button
            onClick={() => setMode("signin")}
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
              mode === "signin"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setMode("signup")}
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
              mode === "signup"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Register
          </button>
        </div>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground">
            {mode === "signup" ? "Create account" : "Welcome back"}
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {mode === "signup"
              ? "Free forever — no credit card needed"
              : "Sign in to continue learning"}
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {mode === "signup" && (
            <div className="space-y-2">
              <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Full Name
              </label>
              <Input
                placeholder="Alex Johnson"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-muted border-border h-12 text-foreground placeholder:text-muted-foreground"
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Email
            </label>
            <Input
              type="email"
              placeholder="name@school.edu"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="bg-muted border-border h-12 text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Password
            </label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="bg-muted border-border h-12 text-foreground placeholder:text-muted-foreground pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl"
          >
            {isSubmitting ? "Please wait…" : mode === "signup" ? "Create Account →" : "Sign In →"}
          </Button>
        </form>

        {mode === "signin" && (
          <p className="text-center text-sm text-muted-foreground mt-4">
            <button className="text-primary hover:underline">Forgot password?</button>
          </p>
        )}
      </div>
    </div>
  );
};

export default AuthForm;
