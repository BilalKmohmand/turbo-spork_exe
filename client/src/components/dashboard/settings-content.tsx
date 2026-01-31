import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Settings, 
  User, 
  Bell, 
  Palette,
  Shield,
  Crown,
  Check
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

  const handleSaveProfile = () => {
    const stored = localStorage.getItem("user");
    if (stored) {
      const userData = JSON.parse(stored);
      userData.displayName = displayName;
      localStorage.setItem("user", JSON.stringify(userData));
      toast({ title: "Profile updated", description: "Your changes have been saved." });
    }
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
          <Button onClick={handleSaveProfile} data-testid="button-save-profile">
            Save Changes
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
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Check className="w-4 h-4 text-emerald-500" />
              Unlimited AI Tutor queries
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Check className="w-4 h-4 text-emerald-500" />
              Lecture notes transcription
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Check className="w-4 h-4 text-emerald-500" />
              Quiz generation
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Check className="w-4 h-4 text-emerald-500" />
              Essay writing assistance
            </div>
          </div>
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
          <Button variant="outline" size="sm">
            Download My Data
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
