import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

interface SettingsContentProps {
  user: UserType;
}

export default function SettingsContent({ user }: SettingsContentProps) {
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState(user.displayName);
  const [notifications, setNotifications] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(false);

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", "/api/auth/profile", { displayName });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update profile");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: "Profile updated", description: "Your display name has been saved." });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleDownloadData = () => {
    const data = {
      user: {
        displayName: user.displayName,
        email: user.email,
        role: user.role,
      },
      exportedAt: new Date().toISOString(),
      note: "This export contains your Gradeio account data.",
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "gradeio-my-data.json";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Download started", description: "Your data has been exported as JSON." });
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Settings className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences</p>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="w-5 h-5 text-violet-600" />
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              data-testid="input-display-name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={user.email}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Account Type</Label>
              <p className="text-sm text-muted-foreground capitalize">{user.role}</p>
            </div>
            <Badge variant="secondary" className="capitalize">{user.role}</Badge>
          </div>
          <Button
            onClick={() => updateProfileMutation.mutate()}
            disabled={updateProfileMutation.isPending || displayName.trim() === user.displayName}
            data-testid="button-save-profile"
          >
            {updateProfileMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="w-5 h-5 text-amber-500" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Push Notifications</Label>
              <p className="text-sm text-muted-foreground">Get notified about AI responses</p>
            </div>
            <Switch
              checked={notifications}
              onCheckedChange={setNotifications}
              data-testid="switch-notifications"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Email Updates</Label>
              <p className="text-sm text-muted-foreground">Receive tips and feature updates</p>
            </div>
            <Switch
              checked={emailUpdates}
              onCheckedChange={setEmailUpdates}
              data-testid="switch-email-updates"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Crown className="w-5 h-5 text-amber-500" />
            Subscription
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-medium">Free Plan</p>
              <p className="text-sm text-muted-foreground">Unlimited AI credits</p>
            </div>
            <Badge className="bg-emerald-600">Active</Badge>
          </div>
          <div className="space-y-2 text-sm mb-4">
            {[
              "Unlimited AI Tutor queries",
              "Lecture notes transcription",
              "Quiz generation",
              "Essay writing assistance",
            ].map((f) => (
              <div key={f} className="flex items-center gap-2 text-muted-foreground">
                <Check className="w-4 h-4 text-emerald-500" />
                {f}
              </div>
            ))}
          </div>
          <Button
            variant="outline"
            className="w-full border-violet-300 dark:border-violet-800 text-violet-700 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/30"
            onClick={() => window.open("/pricing", "_blank")}
            data-testid="button-upgrade"
          >
            <Crown className="w-4 h-4 mr-2 text-amber-500" />
            View Upgrade Options
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="w-5 h-5 text-blue-500" />
            Privacy & Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Your data is encrypted and securely stored. We never share your personal information with third parties.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadData}
            data-testid="button-download-data"
          >
            <Download className="w-4 h-4 mr-2" />
            Download My Data
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
