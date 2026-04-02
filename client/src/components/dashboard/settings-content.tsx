import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient as qc } from "@/lib/queryClient";
import { 
  Settings, 
  User, 
  Bell, 
  Shield,
  Crown,
  Check,
  Loader2,
  Download,
  School,
  Plus,
  X,
} from "lucide-react";
import type { User as UserType } from "@/hooks/use-auth";

interface ClassItem {
  id: string;
  name: string;
  subject: string;
  classCode: string;
  teacherId: string;
}

function JoinClassSection() {
  const { toast } = useToast();
  const qclient = useQueryClient();
  const [code, setCode] = useState("");

  const { data: joinedClasses = [] } = useQuery<ClassItem[]>({
    queryKey: ["/api/student/classes"],
  });

  const joinMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/classes/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classCode: code.trim().toUpperCase() }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to join class");
      return data;
    },
    onSuccess: (data) => {
      qclient.invalidateQueries({ queryKey: ["/api/student/classes"] });
      setCode("");
      toast({ title: `Joined "${data.class.name}"!`, variant: "success" });
    },
    onError: (e: any) => toast({ title: e.message, variant: "destructive", duration: 5000 }),
  });

  return (
    <section className="space-y-6">
      <h3 className="text-[13px] font-bold uppercase tracking-widest text-[#999990]">My Classes</h3>
      <Card className="border-[#E5E5E0] dark:border-[#22221F] rounded-[24px]">
        <CardContent className="p-8 space-y-6">
          <div>
            <Label className="text-sm font-semibold mb-3 block">Join a Class</Label>
            <p className="text-[13px] text-[#666660] mb-4">Enter the class code given by your teacher.</p>
            <div className="flex gap-3">
              <Input
                data-testid="input-class-code"
                placeholder="e.g. A3K9MN"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === "Enter" && code.trim() && joinMutation.mutate()}
                className="h-12 rounded-xl border-[#E5E5E0] dark:border-[#22221F] font-mono tracking-widest uppercase"
                maxLength={8}
              />
              <Button
                onClick={() => joinMutation.mutate()}
                disabled={!code.trim() || joinMutation.isPending}
                className="h-12 px-6 rounded-xl bg-black dark:bg-white text-white dark:text-black font-semibold shrink-0"
                data-testid="button-join-class"
              >
                {joinMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4 mr-2" /> Join</>}
              </Button>
            </div>
          </div>

          {joinedClasses.length > 0 && (
            <div>
              <Label className="text-sm font-semibold mb-3 block">Enrolled Classes</Label>
              <div className="space-y-2">
                {joinedClasses.map(cls => (
                  <div
                    key={cls.id}
                    data-testid={`enrolled-class-${cls.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl bg-[#F9F9F8] dark:bg-[#111110]"
                  >
                    <div className="w-9 h-9 rounded-lg bg-[#111110] dark:bg-white flex items-center justify-center shrink-0">
                      <School className="w-4 h-4 text-white dark:text-black" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-[#111110] dark:text-[#F9F9F8] truncate">{cls.name}</p>
                      <p className="text-[11px] text-[#999990]">{cls.subject} · Code: <span className="font-mono font-bold">{cls.classCode}</span></p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

export default function SettingsContent({ user }: { user: UserType }) {
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState(user.displayName);

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", "/api/auth/profile", { displayName });
      return res.json();
    },
    onSuccess: () => {
      const stored = localStorage.getItem("user");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          localStorage.setItem("user", JSON.stringify({ ...parsed, displayName }));
        } catch {}
      }
      qc.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: "Settings saved", variant: "success" });
    },
    onError: () => toast({ title: "Failed to save settings", variant: "destructive", duration: 5000 }),
  });

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-10">
      <header className="mb-12">
        <h2 className="text-3xl font-bold tracking-tight mb-2">Settings</h2>
        <p className="text-[#666660]">Manage your account and preferences</p>
      </header>

      <section className="space-y-6">
        <h3 className="text-[13px] font-bold uppercase tracking-widest text-[#999990]">Profile Information</h3>
        <Card className="border-[#E5E5E0] dark:border-[#22221F] rounded-[24px]">
          <CardContent className="p-8 space-y-8">
            <div className="grid sm:grid-cols-2 gap-8">
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Display Name</Label>
                <Input 
                  value={displayName} 
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="h-12 rounded-xl border-[#E5E5E0] dark:border-[#22221F]"
                />
              </div>
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Email Address</Label>
                <Input 
                  value={user.email} 
                  disabled 
                  className="h-12 rounded-xl bg-[#F9F9F8] dark:bg-[#111110] border-[#E5E5E0] dark:border-[#22221F]"
                />
              </div>
            </div>
            <div className="pt-4 border-t border-[#F0F0F0] dark:border-[#22221F]">
              <Button 
                onClick={() => updateProfileMutation.mutate()}
                disabled={updateProfileMutation.isPending || displayName === user.displayName}
                className="h-12 px-8 rounded-xl bg-black dark:bg-white text-white dark:text-black font-semibold"
              >
                {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-6">
        <h3 className="text-[13px] font-bold uppercase tracking-widest text-[#999990]">Billing & Subscription</h3>
        <Card className="border-[#E5E5E0] dark:border-[#22221F] rounded-[24px] bg-[#F9F9F8] dark:bg-[#111110]">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-black dark:bg-white flex items-center justify-center">
                  <Crown className="w-6 h-6 text-white dark:text-black" />
                </div>
                <div>
                  <p className="font-bold text-lg">TheHighGrader Plus</p>
                  <p className="text-sm text-[#666660]">Active • $0.00 / month</p>
                </div>
              </div>
              <Badge className="bg-emerald-500 hover:bg-emerald-600 rounded-lg py-1 px-3">Standard</Badge>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                "Unlimited AI Sessions",
                "Advanced Quiz Generation",
                "Lecture Transcription",
                "Priority Support"
              ].map(f => (
                <div key={f} className="flex items-center gap-2 text-sm text-[#666660]">
                  <Check className="w-4 h-4 text-emerald-500" /> {f}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {user.role !== "teacher" && <JoinClassSection />}
    </div>
  );
}
