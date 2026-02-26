import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Settings, 
  User, 
  Bell, 
  Shield,
  Crown,
  Check,
  Loader2,
  Download,
} from "lucide-react";
import type { User as UserType } from "@/hooks/use-auth";

export default function SettingsContent({ user }: { user: UserType }) {
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState(user.displayName);

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", "/api/auth/profile", { displayName });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: "Settings saved" });
    },
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
                  <p className="font-bold text-lg">Gradeio Plus</p>
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
    </div>
  );
}
